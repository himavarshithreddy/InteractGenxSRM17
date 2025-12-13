'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGeneratedUI } from './GeneratedUIContext';
import { useUser } from './UserProvider';

export default function ChatBot() {
  const router = useRouter();
  const { addGeneratedComponent } = useGeneratedUI();
  const { currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! What would you like to do? Just tell me what you need - like 'I need to update product stock' or 'I need to view my orders' - and I'll build it for you."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          userId: currentUser?.id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Handle UI component generation - check if response contains ui_component type
      if (data.response && typeof data.response === 'object' && data.response.type === 'ui_component') {
        const componentData = data.response;
        
        // Add component to context
        addGeneratedComponent({
          title: componentData.title || 'Generated Component',
          code: componentData.code,
          description: componentData.description || componentData.explanation,
        });
        
        // Show explanation in chat
        const explanation = componentData.explanation || `Generated component: ${componentData.title}`;
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `${explanation}\n\n✅ Component generated! Redirecting to view it...`,
          componentGenerated: true
        }]);
        
        // Navigate to generated page after a short delay
        setTimeout(() => {
          router.push('/generated');
          setIsOpen(false);
        }, 1500);
      } else {
        // Handle text response - show whatever Gemini returned
        const content = data.response?.content || data.response || data.rawResponse || 'Sorry, I could not generate a response.';
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please make sure the server is running and the Gemini API key is configured.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 'var(--radius)',
          color: 'white',
          fontSize: '0.875rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: '500',
          transition: 'var(--transition)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        title="Open AI Assistant"
      >
        <span style={{ fontSize: '1.25rem' }}>🤖</span>
        <span>AI Assistant</span>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '280px',
        bottom: '2rem',
        width: '450px',
        maxWidth: 'calc(100vw - 320px)',
        height: '600px',
        maxHeight: 'calc(100vh - 4rem)',
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
        border: '1px solid var(--gray-200)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🤖</div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '1rem' }}>AI Assistant</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Schema-aware helper</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'var(--gray-50)',
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'white',
                color: msg.role === 'user' ? 'white' : 'var(--gray-900)',
                boxShadow: msg.role === 'user' ? 'none' : 'var(--shadow-sm)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--gray-200)',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                background: 'white',
                border: '1px solid var(--gray-200)',
                fontSize: '0.875rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  animation: 'pulse 1.5s ease-in-out infinite 0.2s',
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  animation: 'pulse 1.5s ease-in-out infinite 0.4s',
                }}
              />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--gray-200)',
          background: 'white',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the schema, generate components..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--gray-300)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'none',
              minHeight: '44px',
              maxHeight: '120px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius)',
              background: loading || !input.trim()
                ? 'var(--gray-300)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'opacity 0.2s ease',
              opacity: loading || !input.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

