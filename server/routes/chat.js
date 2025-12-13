require('dotenv').config();
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Get Gemini API key from environment variable
const GEMINI_API_KEY = "AIzaSyAJ15lc_LjqSLK_KxC1uUCkaE4hxlXtCWw";
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Helper function to make HTTP requests (compatible with older Node.js)
function fetch(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.resolve(jsonData),
            text: () => Promise.resolve(data),
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.reject(e),
            text: () => Promise.resolve(data),
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Read schema file
function getSchema() {
  const schemaPath = path.join(__dirname, '..', 'website-schema.json');
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    return JSON.parse(schemaContent);
  } catch (error) {
    console.error('Error reading schema file:', error);
    return null;
  }
}

// Helper function to get user preferences
async function getUserPreferences(userId) {
  return new Promise((resolve) => {
    const { getDb } = require('../database');
    const db = getDb();
    db.get(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId],
      (err, row) => {
        if (err || !row) {
          resolve(null);
        } else {
          // Parse JSON fields
          const prefs = { ...row };
          if (prefs.favorite_modules) {
            try {
              prefs.favorite_modules = JSON.parse(prefs.favorite_modules);
            } catch (e) {
              prefs.favorite_modules = null;
            }
          }
          if (prefs.custom_settings) {
            try {
              prefs.custom_settings = JSON.parse(prefs.custom_settings);
            } catch (e) {
              prefs.custom_settings = null;
            }
          }
          resolve(prefs);
        }
      }
    );
  });
}

// Helper function to get user activity
async function getUserActivity(userId, limit = 20) {
  return new Promise((resolve) => {
    const { getDb } = require('../database');
    const db = getDb();
    db.all(
      'SELECT * FROM user_activity_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit],
      (err, rows) => {
        if (err) {
          resolve([]);
        } else {
          const activities = rows.map(row => ({
            ...row,
            metadata: row.metadata ? (() => {
              try { return JSON.parse(row.metadata); } catch (e) { return null; }
            })() : null,
          }));
          resolve(activities);
        }
      }
    );
  });
}

// POST /api/chat - Chat with Gemini API
router.post('/', async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.' 
      });
    }

    // Get schema
    const schema = getSchema();
    if (!schema) {
      return res.status(500).json({ error: 'Failed to load schema file' });
    }

    // Get user preferences and activity if userId is provided
    let userPreferences = null;
    let userActivity = [];
    if (userId) {
      userPreferences = await getUserPreferences(userId);
      userActivity = await getUserActivity(userId, 20);
    }

    // Create user context section if available
    const userContext = userId && (userPreferences || userActivity.length > 0) ? `

CURRENT USER CONTEXT:
- User ID: ${userId}
${userPreferences ? `- Preferences: ${JSON.stringify(userPreferences, null, 2)}` : ''}
${userActivity.length > 0 ? `- Recent Activity (last ${userActivity.length} actions): ${JSON.stringify(userActivity, null, 2)}` : ''}

ANALYZE USER ACTIVITY TO SUGGEST NEXT ACTIONS:
- Look at the most frequent modules/actions the user visits (check "module" and "action_type" fields)
- Identify patterns (e.g., if user often views products after viewing inventory, suggest product-related actions)
- Check favorite_modules from preferences to see what the user prefers
- Based on activity patterns, suggest 2-4 most likely next pages/sections the user might visit
- Add quick action buttons/links at the bottom of generated components pointing to these suggested pages
- IMPORTANT: Use Link directly (it's already available in scope), do NOT declare "const Link = require('next/link').default"
- Use Next.js Link: React.createElement(Link, { href: '/page' }, React.createElement('button', { className: 'btn btn-secondary', style: { background: 'var(--gray-200)', color: 'var(--gray-900)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer' } }, 'Action Text'))
- Style quick actions section: React.createElement('div', { style: { marginTop: '2rem', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' } }, React.createElement('h4', { style: { marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: 'var(--gray-700)' } }, 'Quick Actions'), React.createElement('div', { style: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' } }, ...buttons))

` : '';

    // Create system prompt - UI GENERATION ONLY
    const systemPrompt = `You are a React UI component generator. Your ONLY job is to generate React UI components as JSON.

Website schema:
${JSON.stringify(schema, null, 2)}
${userContext}

YOU MUST ALWAYS respond with valid JSON in this EXACT format (no markdown, no code blocks, no text outside JSON):

{
  "type": "ui_component",
  "title": "Component Title",
  "description": "Brief description",
  "code": "function ComponentName() { /* React code using React.createElement */ }",
  "explanation": "Brief explanation"
}

EXAMPLE 1 - Edit Product Stock Threshold (with dropdown):
{
  "type": "ui_component",
  "title": "Edit Product Stock Threshold",
  "description": "Form to edit product low stock threshold with product selection dropdown",
  "code": "function EditProductStock() { const [products, setProducts] = useState([]); const [selectedProductId, setSelectedProductId] = useState(''); const [threshold, setThreshold] = useState(0); const [loading, setLoading] = useState(false); const [fetching, setFetching] = useState(true); useEffect(() => { inventoryAPI.getProducts({ limit: 100 }).then(res => { setProducts(res.data || []); setFetching(false); }).catch(err => { alert('Error loading products: ' + err.message); setFetching(false); }); }, []); const handleSubmit = async (e) => { e.preventDefault(); if (!selectedProductId) { alert('Please select a product'); return; } setLoading(true); try { await inventoryAPI.updateProduct(selectedProductId, { low_stock_threshold: parseInt(threshold) }); alert('Updated successfully'); } catch (err) { alert('Error: ' + err.message); } finally { setLoading(false); } }; if (fetching) return React.createElement('div', { className: 'card' }, 'Loading products...'); return React.createElement('div', { className: 'card' }, React.createElement('h3', null, 'Edit Product Stock Threshold'), React.createElement('form', { onSubmit: handleSubmit }, React.createElement('div', { style: { marginBottom: '1rem' } }, React.createElement('label', { style: { display: 'block', marginBottom: '0.5rem', fontWeight: '600' } }, 'Select Product'), React.createElement('select', { value: selectedProductId, onChange: (e) => setSelectedProductId(e.target.value), required: true, style: { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' } }, React.createElement('option', { value: '' }, 'Select a product'), products.map(p => React.createElement('option', { key: p.id, value: p.id }, p.name + ' (ID: ' + p.id + ')')))), React.createElement('div', { style: { marginBottom: '1rem' } }, React.createElement('label', { style: { display: 'block', marginBottom: '0.5rem', fontWeight: '600' } }, 'Low Stock Threshold'), React.createElement('input', { type: 'number', placeholder: 'Low Stock Threshold', value: threshold, onChange: (e) => setThreshold(e.target.value), required: true, style: { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' } })), React.createElement('button', { type: 'submit', disabled: loading, style: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: loading ? 'not-allowed' : 'pointer' } }, loading ? 'Saving...' : 'Save'))); }",
  "explanation": "Form to edit product low stock threshold with product dropdown selection using inventoryAPI"
}

EXAMPLE 2 - Update Order Status (with dropdown and quick actions):
{
  "type": "ui_component",
  "title": "Update Order Status",
  "description": "Form to update order status with order selection dropdown and suggested quick actions",
  "code": "function UpdateOrderStatus() { const [orders, setOrders] = useState([]); const [selectedOrderId, setSelectedOrderId] = useState(''); const [status, setStatus] = useState('pending'); const [loading, setLoading] = useState(false); const [fetching, setFetching] = useState(true); useEffect(() => { operationsAPI.getOrders({ limit: 100 }).then(res => { setOrders(res.data || []); setFetching(false); }).catch(err => { alert('Error loading orders: ' + err.message); setFetching(false); }); }, []); const handleSubmit = async (e) => { e.preventDefault(); if (!selectedOrderId) { alert('Please select an order'); return; } setLoading(true); try { await operationsAPI.updateOrder(selectedOrderId, { status: status }); alert('Order updated successfully'); } catch (err) { alert('Error: ' + err.message); } finally { setLoading(false); } }; if (fetching) return React.createElement('div', { className: 'card' }, 'Loading orders...'); return React.createElement('div', { className: 'card' }, React.createElement('h3', null, 'Update Order Status'), React.createElement('form', { onSubmit: handleSubmit }, React.createElement('div', { style: { marginBottom: '1rem' } }, React.createElement('label', { style: { display: 'block', marginBottom: '0.5rem', fontWeight: '600' } }, 'Select Order'), React.createElement('select', { value: selectedOrderId, onChange: (e) => setSelectedOrderId(e.target.value), required: true, style: { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' } }, React.createElement('option', { value: '' }, 'Select an order'), orders.map(o => React.createElement('option', { key: o.id, value: o.id }, o.order_number + ' - ' + o.customer_name + ' (ID: ' + o.id + ')')))), React.createElement('div', { style: { marginBottom: '1rem' } }, React.createElement('label', { style: { display: 'block', marginBottom: '0.5rem', fontWeight: '600' } }, 'Status'), React.createElement('select', { value: status, onChange: (e) => setStatus(e.target.value), required: true, style: { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' } }, React.createElement('option', { value: 'pending' }, 'Pending'), React.createElement('option', { value: 'processing' }, 'Processing'), React.createElement('option', { value: 'shipped' }, 'Shipped'), React.createElement('option', { value: 'completed' }, 'Completed'), React.createElement('option', { value: 'cancelled' }, 'Cancelled'))), React.createElement('button', { type: 'submit', disabled: loading, style: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: loading ? 'not-allowed' : 'pointer' } }, loading ? 'Updating...' : 'Update Order')), React.createElement('div', { style: { marginTop: '2rem', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' } }, React.createElement('h4', { style: { marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: 'var(--gray-700)' } }, 'Suggested Actions'), React.createElement('div', { style: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' } }, React.createElement(Link, { href: '/operations' }, React.createElement('button', { className: 'btn', style: { background: 'var(--gray-200)', color: 'var(--gray-900)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer' } }, 'View All Orders')), React.createElement(Link, { href: '/logistics' }, React.createElement('button', { className: 'btn', style: { background: 'var(--gray-200)', color: 'var(--gray-900)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer' } }, 'View Shipments')), React.createElement(Link, { href: '/' }, React.createElement('button', { className: 'btn', style: { background: 'var(--gray-200)', color: 'var(--gray-900)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer' } }, 'Dashboard'))))); }",
  "explanation": "Form to update order status with order dropdown selection, includes quick action buttons based on user activity patterns"
}

EXAMPLE 3 - Edit Cost of Low Stock Products (conditional filtering):
{
  "type": "ui_component",
  "title": "Update Cost for Low Stock Products",
  "description": "Edit cost for products that are low on stock",
  "code": "function UpdateLowStockProductCost() { const [products, setProducts] = useState([]); const [editingCosts, setEditingCosts] = useState({}); const [updatingIds, setUpdatingIds] = useState(new Set()); const [fetching, setFetching] = useState(true); useEffect(() => { inventoryAPI.getProducts({ low_stock: 'true' }).then(res => { setProducts(res.data || []); const initialCosts = {}; (res.data || []).forEach(p => { initialCosts[p.id] = p.cost || 0; }); setEditingCosts(initialCosts); setFetching(false); }).catch(err => { alert('Error loading products: ' + err.message); setFetching(false); }); }, []); const handleCostChange = (productId, newCost) => { setEditingCosts({ ...editingCosts, [productId]: parseFloat(newCost) || 0 }); }; const handleUpdate = async (productId) => { const newCost = editingCosts[productId]; if (newCost === undefined || newCost < 0) { alert('Please enter a valid cost'); return; } setUpdatingIds(new Set([...updatingIds, productId])); try { await inventoryAPI.updateProduct(productId, { cost: newCost }); alert('Cost updated successfully'); const updatedProducts = await inventoryAPI.getProducts({ low_stock: 'true' }); setProducts(updatedProducts.data || []); const updatedCosts = {}; (updatedProducts.data || []).forEach(p => { updatedCosts[p.id] = p.cost || 0; }); setEditingCosts(updatedCosts); } catch (err) { alert('Error updating cost: ' + err.message); } finally { setUpdatingIds(new Set([...updatingIds].filter(id => id !== productId))); } }; if (fetching) return React.createElement('div', { className: 'card' }, 'Loading low stock products...'); if (products.length === 0) return React.createElement('div', { className: 'card' }, React.createElement('h3', null, 'Update Cost for Low Stock Products'), React.createElement('p', null, 'No products are currently low on stock.')); return React.createElement('div', { className: 'card' }, React.createElement('h3', null, 'Update Cost for Low Stock Products'), React.createElement('p', { style: { marginBottom: '1.5rem', color: 'var(--gray-600)' } }, 'Found ' + products.length + ' product(s) with low stock'), React.createElement('div', { style: { overflowX: 'auto' } }, React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } }, React.createElement('thead', null, React.createElement('tr', { style: { borderBottom: '2px solid var(--gray-200)' } }, React.createElement('th', { style: { padding: '0.75rem', textAlign: 'left', fontWeight: '600' } }, 'Product Name'), React.createElement('th', { style: { padding: '0.75rem', textAlign: 'left', fontWeight: '600' } }, 'SKU'), React.createElement('th', { style: { padding: '0.75rem', textAlign: 'left', fontWeight: '600' } }, 'Current Stock'), React.createElement('th', { style: { padding: '0.75rem', textAlign: 'left', fontWeight: '600' } }, 'Current Cost'), React.createElement('th', { style: { padding: '0.75rem', textAlign: 'left', fontWeight: '600' } }, 'New Cost'), React.createElement('th', { style: { padding: '0.75rem', textAlign: 'left', fontWeight: '600' } }, 'Actions'))), React.createElement('tbody', null, products.map(p => React.createElement('tr', { key: p.id, style: { borderBottom: '1px solid var(--gray-200)' } }, React.createElement('td', { style: { padding: '0.75rem' } }, p.name), React.createElement('td', { style: { padding: '0.75rem' } }, p.sku), React.createElement('td', { style: { padding: '0.75rem' } }, p.stock_quantity), React.createElement('td', { style: { padding: '0.75rem' } }, '$' + (p.cost || 0).toFixed(2)), React.createElement('td', { style: { padding: '0.75rem' } }, React.createElement('input', { type: 'number', step: '0.01', min: '0', value: editingCosts[p.id] || 0, onChange: (e) => handleCostChange(p.id, e.target.value), style: { width: '100px', padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-300)' } })), React.createElement('td', { style: { padding: '0.75rem' } }, React.createElement('button', { onClick: () => handleUpdate(p.id), disabled: updatingIds.has(p.id), style: { padding: '0.5rem 1rem', background: updatingIds.has(p.id) ? 'var(--gray-400)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: updatingIds.has(p.id) ? 'not-allowed' : 'pointer' } }, updatingIds.has(p.id) ? 'Updating...' : 'Update'))))))); }",
  "explanation": "Component to edit cost for products filtered by low stock condition, with inline editing and per-row update functionality"
}

CRITICAL RULES FOR UPDATE/EDIT FORMS:
- NEVER use text input for ID/entity selection - ALWAYS use dropdown
- ALWAYS fetch the list using GET API in useEffect when component mounts:
  * For products: inventoryAPI.getProducts()
  * For orders: operationsAPI.getOrders()
  * For customers: operationsAPI.getCustomers()
  * For shipments: logisticsAPI.getShipments()
  * For warehouses: logisticsAPI.getWarehouses()
  * For campaigns: marketingAPI.getCampaigns()
  * For users: usersAPI.getUsers()
- Show loading state while fetching list
- Display items in SELECT dropdown with format: "Item Name (ID: 123)"
- Store selected ID in state (e.g., selectedProductId, selectedOrderId)
- Use the selected ID in the update API call (e.g., inventoryAPI.updateProduct(selectedProductId, data))

MULTIPLE OPERATIONS IN ONE COMPONENT:
- If user requests multiple operations (e.g., "update warehouse capacity and product low stock threshold"), create ONE component with:
  * Multiple tabs or sections for each operation
  * OR a single form with fields for all operations
  * Use tabs if operations are logically separate, use single form if they're related
- Example: If updating warehouse and product, use tabs: React.createElement('div', { className: 'tabs' }, React.createElement('button', { onClick: () => setActiveTab('warehouse'), className: activeTab === 'warehouse' ? 'tab active' : 'tab' }, 'Update Warehouse'), React.createElement('button', { onClick: () => setActiveTab('product'), className: activeTab === 'product' ? 'tab active' : 'tab' }, 'Update Product'))
- Each tab/section should have its own form with dropdown selection and fields

CONDITIONAL FILTERING AND EDITING:
- When user requests to edit/change items that match a condition (e.g., "change cost of products that are low on stock", "update status of pending orders"):
  1. FIRST: Fetch filtered data using API query parameters:
     * For low stock products: inventoryAPI.getProducts({ low_stock: 'true' })
     * For pending orders: operationsAPI.getOrders({ status: 'pending' })
     * For specific categories: inventoryAPI.getProducts({ category: 'Electronics' })
  2. Display the filtered list in a table or list format showing relevant fields
  3. For each item, provide inline editing or edit buttons:
     * Option A: Inline editing - editable input fields directly in the table
     * Option B: Edit buttons - click to open a modal or form for that specific item
  4. When user edits, call the update API with the item's ID: inventoryAPI.updateProduct(itemId, { cost: newCost })
  5. After successful update, refresh the filtered list
- Example structure for "change cost of products that are low on stock":
  * Fetch: inventoryAPI.getProducts({ low_stock: 'true' })
  * Display: Table with columns: Name, SKU, Current Cost, Stock, New Cost (editable), Actions
  * Each row has an input field for new cost and a "Update" button
  * On update: inventoryAPI.updateProduct(product.id, { cost: parseFloat(newCost) })
  * Show loading state per row while updating
  * After update, refresh the list to show updated costs

GENERAL RULES:
1. ALWAYS return valid JSON only - start with { and end with } (NOT an array [])
2. Use React.createElement (NOT JSX)
3. Use hooks: useState, useEffect
4. Use APIs: operationsAPI, marketingAPI, inventoryAPI, logisticsAPI, analyticsAPI, usersAPI
5. Follow patterns from schema
6. Handle loading states (both for fetching list and for submitting)
7. Use exact field names from schema
8. For update forms: Fetch list → Show dropdown → User selects → Update with selected ID
9. If user context is provided, ALWAYS add quick action suggestions section at the bottom analyzing user activity patterns
10. Return ONLY ONE JSON object, not an array - even if handling multiple operations, wrap everything in a single component
11. CRITICAL: ALWAYS ensure try-catch-finally blocks are COMPLETE - every try MUST have a matching catch or finally block. Never leave try blocks incomplete.
12. CRITICAL: Ensure all function bodies, if statements, and code blocks are properly closed with matching braces

RESPOND WITH JSON ONLY - NO MARKDOWN, NO CODE BLOCKS, NO TEXT OUTSIDE JSON - RETURN A SINGLE OBJECT {}, NOT AN ARRAY []:`;

    const userPrompt = `Generate a UI component based on this request: ${message}

CRITICAL: Respond with ONLY valid JSON in the exact format shown in the examples. Start with { and end with }. No markdown, no code blocks, no explanations outside JSON.`;

    // Prepare request to Gemini API
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nUser question: ${userPrompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2, // Lower temperature for more consistent JSON output
        topK: 40, 
        topP: 0.95,
        maxOutputTokens: 16384, // Increased for longer component code // More tokens for longer component code
        responseMimeType: "application/json", // Force JSON response
      }
    };

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return res.status(response.status).json({ 
        error: `Gemini API error: ${response.statusText}`,
        details: errorData
      });
    }

    const data = await response.json();

    // Extract response from Gemini - handle JSON mime type response
    let responseText = '';
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content;
      
      // When responseMimeType is "application/json", response is in parts[0].text as JSON string
      if (content.parts && content.parts[0] && content.parts[0].text) {
        responseText = content.parts[0].text;
        // Try parsing immediately since it should be JSON
        try {
          const parsed = JSON.parse(responseText);
          // Handle both object and array responses
          if (Array.isArray(parsed)) {
            const uiComponent = parsed.find(item => item && item.type === 'ui_component');
            if (uiComponent) {
              return res.json({ 
                response: uiComponent,
                rawResponse: responseText 
              });
            }
          } else if (parsed && parsed.type === 'ui_component') {
            return res.json({ 
              response: parsed,
              rawResponse: responseText 
            });
          }
        } catch (e) {
          // Continue to parsing strategies below
        }
      }
    }

    if (!responseText) {
      console.error('No response in Gemini data:', JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'No response from Gemini API' });
    }

    // Parse JSON response - multiple strategies to ensure we get it
    let parsedResponse = null;
    
    // Helper function to extract ui_component from parsed JSON (handles both objects and arrays)
    const extractUIComponent = (parsed) => {
      if (Array.isArray(parsed)) {
        // If it's an array, find the first element with type 'ui_component'
        return parsed.find(item => item && item.type === 'ui_component') || null;
      } else if (parsed && parsed.type === 'ui_component') {
        return parsed;
      }
      return null;
    };

    // Strategy 1: Direct JSON parse (should work with responseMimeType: "application/json")
    try {
      const trimmed = responseText.trim();
      parsedResponse = JSON.parse(trimmed);
      const uiComponent = extractUIComponent(parsedResponse);
      if (uiComponent) {
        return res.json({ 
          response: uiComponent,
          rawResponse: responseText 
        });
      }
    } catch (e1) {
      console.log('Strategy 1 failed:', e1.message);
    }
    
    // Strategy 2: Extract from markdown code blocks (fallback)
    try {
      // Try to match both object and array patterns
      const jsonBlockMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/);
      if (jsonBlockMatch) {
        parsedResponse = JSON.parse(jsonBlockMatch[1].trim());
        const uiComponent = extractUIComponent(parsedResponse);
        if (uiComponent) {
          return res.json({ 
            response: uiComponent,
            rawResponse: responseText 
          });
        }
      }
    } catch (e2) {
      console.log('Strategy 2 failed:', e2.message);
    }
    
    // Strategy 3: Find JSON boundaries (object or array)
    try {
      const jsonStart = responseText.match(/[{\[]/);
      const jsonEnd = responseText.match(/[}\]]/);
      if (jsonStart && jsonEnd) {
        const startIdx = jsonStart.index;
        // Find matching closing bracket/brace
        let depth = 0;
        let endIdx = startIdx;
        for (let i = startIdx; i < responseText.length; i++) {
          if (responseText[i] === '{' || responseText[i] === '[') depth++;
          if (responseText[i] === '}' || responseText[i] === ']') depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
        const jsonStr = responseText.substring(startIdx, endIdx).trim();
        parsedResponse = JSON.parse(jsonStr);
        const uiComponent = extractUIComponent(parsedResponse);
        if (uiComponent) {
          return res.json({ 
            response: uiComponent,
            rawResponse: responseText 
          });
        }
      }
    } catch (e3) {
      console.log('Strategy 3 failed:', e3.message);
    }
    
    // Strategy 4: Try to fix common JSON issues (handle both objects and arrays)
    try {
      // Remove leading/trailing whitespace and common prefixes
      let cleaned = responseText.trim()
        .replace(/^[^{[]*/, '') // Remove anything before { or [
        .replace(/[^}\]]*$/, ''); // Remove anything after } or ]
      // Ensure proper closing
      if (cleaned.startsWith('[') && !cleaned.endsWith(']')) {
        cleaned += ']';
      } else if (cleaned.startsWith('{') && !cleaned.endsWith('}')) {
        cleaned += '}';
      }
      parsedResponse = JSON.parse(cleaned);
      const uiComponent = extractUIComponent(parsedResponse);
      if (uiComponent) {
        return res.json({ 
          response: uiComponent,
          rawResponse: responseText 
        });
      }
    } catch (e4) {
      console.log('Strategy 4 failed:', e4.message);
    }
    
    // Strategy 5: Fix unterminated strings by intelligently closing them
    try {
      let fixed = responseText.trim();
      
      // Check if we have an unterminated string error
      if (fixed.includes('"code"') && !fixed.match(/"code"\s*:\s*"[^"]*"[,\s}]/)) {
        // The code field appears to be unterminated
        // Find where "code" field starts
        const codeMatch = fixed.match(/"code"\s*:\s*"/);
        if (codeMatch) {
          const codeStart = codeMatch.index + codeMatch[0].length;
          
          // Try to find where the code should end by looking for patterns
          // Option 1: Look for "explanation" field after code
          const expMatch = fixed.match(/"explanation"\s*:\s*"/);
          if (expMatch && expMatch.index > codeStart) {
            // Code should end before explanation - find the last quote
            // But be careful - we need to escape any quotes in the code
            const beforeExp = fixed.substring(codeStart, expMatch.index);
            // Find the last unescaped quote, or add one
            let lastQuote = -1;
            for (let i = beforeExp.length - 1; i >= 0; i--) {
              if (beforeExp[i] === '"' && (i === 0 || beforeExp[i-1] !== '\\')) {
                lastQuote = i;
                break;
              }
            }
            if (lastQuote >= 0) {
              fixed = fixed.substring(0, codeStart + lastQuote + 1) + fixed.substring(expMatch.index);
            } else {
              // No quote found, add one before explanation
              fixed = fixed.substring(0, expMatch.index) + '"' + fixed.substring(expMatch.index);
            }
          } else {
            // No explanation field - need to close code and add explanation
            // Find a safe truncation point (try to end at a function or statement boundary)
            const truncated = fixed.substring(0, Math.min(fixed.length, 7000));
            // Try to find a good ending point - look for closing braces/parentheses
            let endPoint = truncated.length;
            for (let i = truncated.length - 1; i >= codeStart + 100; i--) {
              if (truncated[i] === '}' || truncated[i] === ')') {
                endPoint = i + 1;
                break;
              }
            }
            // Escape any unescaped quotes in the code
            let codeContent = truncated.substring(codeStart, endPoint);
            codeContent = codeContent.replace(/([^\\])"/g, '$1\\"'); // Escape unescaped quotes
            fixed = fixed.substring(0, codeStart) + codeContent + '", "explanation": "Component code"}';
          }
        }
      }
      
      parsedResponse = JSON.parse(fixed);
      const uiComponent = extractUIComponent(parsedResponse);
      if (uiComponent) {
        return res.json({ 
          response: uiComponent,
          rawResponse: responseText 
        });
      }
    } catch (e5) {
      console.log('Strategy 5 failed:', e5.message);
    }
    
    // Strategy 6: Extract partial JSON by parsing fields individually (last resort)
    try {
      // Find positions of key fields
      const titleMatch = responseText.match(/"title"\s*:\s*"([^"]+)"/);
      const descMatch = responseText.match(/"description"\s*:\s*"([^"]+)"/);
      const codeStartMatch = responseText.match(/"code"\s*:\s*"/);
      
      if (titleMatch && codeStartMatch) {
        const codeStart = codeStartMatch.index + codeStartMatch[0].length;
        // Extract code content - look for the end of the code string
        // First, try to find "explanation" field which comes after code
        const expMatch = responseText.match(/"explanation"\s*:\s*"/);
        let codeEnd = expMatch ? expMatch.index : responseText.length;
        
        // Try to find the actual closing quote of the code field
        // We need to handle escaped quotes properly
        let actualCodeEnd = codeEnd;
        let inString = true;
        let escaped = false;
        for (let i = codeStart; i < codeEnd && i < responseText.length; i++) {
          const char = responseText[i];
          if (escaped) {
            escaped = false;
            continue;
          }
          if (char === '\\') {
            escaped = true;
            continue;
          }
          if (char === '"') {
            // Check if this is the closing quote (next non-whitespace should be , or })
            let j = i + 1;
            while (j < responseText.length && /\s/.test(responseText[j])) {
              j++;
            }
            if (j < responseText.length && (responseText[j] === ',' || responseText[j] === '}')) {
              actualCodeEnd = i;
              break;
            }
          }
        }
        
        // Extract code content, but ensure we find complete try-catch-finally blocks
        let codeContent = responseText.substring(codeStart, actualCodeEnd);
        
        // Find the actual end of the code string by looking for the closing quote
        // Count try-catch-finally blocks to ensure completeness
        let tryCount = (codeContent.match(/\btry\s*{/g) || []).length;
        let catchCount = (codeContent.match(/\bcatch\s*\(/g) || []).length;
        let finallyCount = (codeContent.match(/\bfinally\s*{/g) || []).length;
        
        // If we have try blocks, ensure we have matching catch or finally
        if (tryCount > 0 && tryCount > (catchCount + finallyCount)) {
          // Code is incomplete - try to find a better ending point
          // Look backwards from the end for complete statements
          let searchEnd = Math.min(codeContent.length, codeStart + 15000); // Increased limit
          let bestEnd = searchEnd;
          
          // Find the last complete try-catch-finally or try-catch block
          const tryCatchFinallyRegex = /try\s*\{[\s\S]*?\}\s*catch\s*\([^)]+\)\s*\{[\s\S]*?\}\s*finally\s*\{[\s\S]*?\}/g;
          const tryCatchRegex = /try\s*\{[\s\S]*?\}\s*catch\s*\([^)]+\)\s*\{[\s\S]*?\}/g;
          
          let lastMatch = null;
          let match;
          
          // Find all try-catch-finally blocks
          while ((match = tryCatchFinallyRegex.exec(codeContent)) !== null) {
            lastMatch = match;
          }
          
          // If no complete try-catch-finally, look for try-catch
          if (!lastMatch) {
            tryCatchRegex.lastIndex = 0;
            while ((match = tryCatchRegex.exec(codeContent)) !== null) {
              lastMatch = match;
            }
          }
          
          if (lastMatch) {
            bestEnd = lastMatch.index + lastMatch[0].length;
          } else {
            // Fallback: find last complete function or statement
            for (let i = codeContent.length - 1; i >= Math.max(0, codeContent.length - 500); i--) {
              if (codeContent[i] === '}' && i > 0) {
                // Check if this closes a try, catch, or finally block
                const before = codeContent.substring(Math.max(0, i - 50), i);
                if (before.match(/(try|catch|finally)\s*\{[\s\S]*$/)) {
                  bestEnd = i + 1;
                  break;
                }
              }
            }
          }
          
          codeContent = codeContent.substring(0, bestEnd);
        } else {
          // Code seems complete, but might still be truncated
          // Find the last closing brace of the function
          let lastBrace = codeContent.lastIndexOf('}');
          if (lastBrace > codeContent.length - 10) {
            codeContent = codeContent.substring(0, lastBrace + 1);
          }
        }
        
        // Escape any unescaped quotes
        codeContent = codeContent.replace(/([^\\])"/g, '$1\\"').replace(/^"/, '\\"');
        
        const partialComponent = {
          type: 'ui_component',
          title: titleMatch[1] || 'Generated Component',
          description: descMatch ? descMatch[1] : 'Generated component',
          code: codeContent,
          explanation: 'Component generated (code may be truncated)'
        };
        
        // Validate we can stringify this
        JSON.stringify(partialComponent);
        
        return res.json({ 
          response: partialComponent,
          rawResponse: responseText 
        });
      }
    } catch (e6) {
      console.log('Strategy 6 failed:', e6.message);
    }
    
    // If all parsing failed, log for debugging
    console.error('Failed to parse JSON from response:', responseText.substring(0, 500));

    // If JSON parsing failed, try to construct a ui_component response anyway
    // Sometimes Gemini returns the structure but with parsing issues
    console.error('Failed to parse as JSON. Raw response:', responseText.substring(0, 1000));
    
    // Return error indicating JSON parsing failed
    res.json({ 
      response: {
        type: 'text_response',
        content: `Error: Could not parse JSON response from AI. Please try again. Raw response: ${responseText.substring(0, 500)}`
      },
      rawResponse: responseText,
      error: 'JSON_PARSE_FAILED'
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;

