'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import Link from 'next/link';
import { 
  operationsAPI, 
  marketingAPI, 
  inventoryAPI, 
  logisticsAPI, 
  analyticsAPI, 
  usersAPI 
} from '../lib/api';

export default function DynamicComponentRenderer({ code, onError }) {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) {
      setComponent(null);
      return;
    }

    try {
      // Clean and prepare the code
      let cleanCode = code.trim();
      
      // Validate try-catch-finally blocks are complete
      const tryMatches = (cleanCode.match(/\btry\s*{/g) || []).length;
      const catchMatches = (cleanCode.match(/\bcatch\s*\(/g) || []).length;
      const finallyMatches = (cleanCode.match(/\bfinally\s*{/g) || []).length;
      
      // Check if we have incomplete try blocks
      if (tryMatches > 0) {
        const totalHandlers = catchMatches + finallyMatches;
        if (tryMatches > totalHandlers) {
          // We have try blocks without matching catch/finally
          // Try to find if there's a try block near the end that's incomplete
          const lastTryIndex = cleanCode.lastIndexOf('try');
          const afterLastTry = cleanCode.substring(lastTryIndex);
          const hasCatchAfter = afterLastTry.includes('catch');
          const hasFinallyAfter = afterLastTry.includes('finally');
          
          if (!hasCatchAfter && !hasFinallyAfter) {
            throw new Error('Incomplete try-catch-finally block detected. The code may have been truncated during generation. Please try again.');
          }
        }
      }
      
      // Remove export default if present
      cleanCode = cleanCode.replace(/export\s+default\s+/, '');
      
      // Remove const Link = require('next/link').default; lines (Link is already provided in scope)
      cleanCode = cleanCode.replace(/(?:const|let|var)\s+Link\s*=\s*require\s*\(\s*['"]next\/link['"]\s*\)\s*\.\s*default\s*;?\s*/g, '');
      
      // Replace any remaining require('next/link').default references with Link
      cleanCode = cleanCode.replace(/require\s*\(\s*['"]next\/link['"]\s*\)\s*\.\s*default/g, 'Link');
      
      // Extract function name from code if present
      const functionMatch = cleanCode.match(/(?:function|const|export\s+function)\s+(\w+)\s*[=(]/);
      const functionName = functionMatch ? functionMatch[1] : 'GeneratedComponent';
      
      // Create a controlled scope for code execution
      const componentScope = {
        React,
        useState: React.useState,
        useEffect: React.useEffect,
        createElement: React.createElement,
        Fragment: React.Fragment,
        Link, // Add Next.js Link component
        operationsAPI,
        marketingAPI,
        inventoryAPI,
        logisticsAPI,
        analyticsAPI,
        usersAPI,
      };
      
      // Use eval in a controlled way to execute the code
      // Wrap in IIFE to capture the component function
      const wrappedCode = `
        (function() {
          const React = arguments[0];
          const useState = arguments[1];
          const useEffect = arguments[2];
          const createElement = arguments[3];
          const Fragment = arguments[4];
          const Link = arguments[5];
          const operationsAPI = arguments[6];
          const marketingAPI = arguments[7];
          const inventoryAPI = arguments[8];
          const logisticsAPI = arguments[9];
          const analyticsAPI = arguments[10];
          const usersAPI = arguments[11];
          
          ${cleanCode}
          
          // Return the component function if it was defined
          if (typeof ${functionName} !== 'undefined') {
            return ${functionName};
          }
          
          // Try to find any exported or defined function
          const funcNames = ['EditProductStock', 'EditProduct', 'ProductForm', 'EditOrder', 'EditShipment'];
          for (const name of funcNames) {
            if (typeof eval(name) !== 'undefined') {
              return eval(name);
            }
          }
          
          return null;
        })
      `;
      
      const componentFactory = eval(wrappedCode);
      const GeneratedComponent = componentFactory(
        React,
        React.useState,
        React.useEffect,
        React.createElement,
        React.Fragment,
        Link,
        operationsAPI,
        marketingAPI,
        inventoryAPI,
        logisticsAPI,
        analyticsAPI,
        usersAPI
      );
      
      if (!GeneratedComponent) {
        throw new Error(`Could not find component function "${functionName}" in generated code`);
      }

      if (typeof GeneratedComponent === 'function') {
        setComponent(() => GeneratedComponent);
        setError(null);
        if (onError) onError(null);
      } else {
        throw new Error('Generated code did not return a valid React component');
      }
    } catch (err) {
      const errorMsg = `Error rendering component: ${err.message}`;
      console.error('Component rendering error:', err);
      setError(errorMsg);
      if (onError) onError(errorMsg);
      
      // Try to show the code for debugging
      setComponent(() => () => (
        <div className="error">
          <strong>Error rendering component:</strong>
          <pre style={{ marginTop: '0.5rem', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
            {err.message}
          </pre>
          <details style={{ marginTop: '1rem' }}>
            <summary>Show code</summary>
            <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', overflow: 'auto', maxHeight: '300px', background: 'var(--gray-100)', padding: '1rem', borderRadius: 'var(--radius)' }}>
              {code}
            </pre>
          </details>
        </div>
      ));
    }
  }, [code, onError]);

  if (!Component) {
    return <div className="loading">Loading component...</div>;
  }

  return <Component />;
}
