# UI Generation Guide

## Overview

The chatbot can now generate actual UI components that are rendered in the main page. When you ask the AI to generate a UI component, it creates React code that integrates with your APIs and renders in real-time.

## How It Works

1. **User asks for UI generation** in the chatbot (e.g., "Create a form to edit product low stock threshold")
2. **Gemini generates React component code** based on the schema
3. **Component is added** to the GeneratedUIContext
4. **User is redirected** to `/generated` page
5. **Component is rendered** using DynamicComponentRenderer

## Example Prompts

### Product Management
- "Create a form to edit the low_stock_threshold of a product"
- "Generate a component to view all products with low stock"
- "Make a form to update product price"

### Order Management
- "Create a form to update order status"
- "Generate a component to filter orders by status"
- "Make a UI to view order details"

### Shipment Tracking
- "Create a form to update shipment status"
- "Generate a component to track shipments"
- "Make a UI to view warehouse inventory"

## Code Generation Format

The AI generates code in this format:

```json
{
  "type": "ui_component",
  "title": "Edit Product Stock Threshold",
  "description": "Form to edit the low stock threshold for a product",
  "code": "function EditProductStock() { ... }",
  "explanation": "This component allows editing product stock threshold"
}
```

## Component Requirements

Generated components should:
- Use React hooks (useState, useEffect)
- Use actual API endpoints from the schema
- Handle loading and error states
- Follow existing UI patterns
- Use proper form validation

## APIs Available

Generated components have access to:
- `operationsAPI` - Orders, customers
- `marketingAPI` - Campaigns, promotions
- `inventoryAPI` - Products, stock movements
- `logisticsAPI` - Shipments, warehouses
- `analyticsAPI` - Analytics data
- `usersAPI` - User management

## React Hooks Available

- `useState` - State management
- `useEffect` - Side effects and API calls
- `React.createElement` - Create elements programmatically
- `React.Fragment` - Fragment wrapper

## Example Generated Component

```javascript
function EditProductStock() {
  const [productId, setProductId] = useState('');
  const [threshold, setThreshold] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await inventoryAPI.updateProduct(productId, { 
        low_stock_threshold: parseInt(threshold) 
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'card' },
    React.createElement('h3', null, 'Edit Product Stock Threshold'),
    React.createElement('form', { onSubmit: handleSubmit },
      React.createElement('input', {
        type: 'text',
        placeholder: 'Product ID',
        value: productId,
        onChange: (e) => setProductId(e.target.value),
        required: true
      }),
      React.createElement('input', {
        type: 'number',
        placeholder: 'Low Stock Threshold',
        value: threshold,
        onChange: (e) => setThreshold(e.target.value),
        required: true
      }),
      React.createElement('button', { 
        type: 'submit', 
        disabled: loading 
      }, loading ? 'Saving...' : 'Save'),
      error && React.createElement('div', { className: 'error' }, error),
      success && React.createElement('div', null, 'Success!')
    )
  );
}
```

## Navigation

- Generated components appear on `/generated` page
- Multiple components can be generated and switched between
- Components persist until cleared
- Use "Clear All" to remove all generated components

## Tips for Best Results

1. **Be specific** - "Create a form to edit product low stock threshold" is better than "make a form"
2. **Mention the API** - "Use inventoryAPI to update product" helps the AI use correct endpoints
3. **Specify fields** - "Include fields: product ID, threshold value" helps generate correct forms
4. **Mention validation** - "Validate that threshold is a positive number" ensures proper validation

## Limitations

- Code execution happens in browser (security consideration for production)
- Complex components might need manual refinement
- Some advanced React patterns might not work
- Components are stateless across page refreshes (stored in context only)

## Troubleshooting

**Component doesn't render:**
- Check browser console for errors
- Verify the code follows React functional component pattern
- Ensure hooks are used correctly

**API calls fail:**
- Check that API endpoint exists in schema
- Verify API method name matches schema
- Ensure server is running

**Component shows error:**
- The error message should indicate the issue
- Check that all required props are provided
- Verify React hooks usage is correct

