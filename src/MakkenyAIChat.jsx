import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Settings, User, Bot, Menu, ChevronRight, ChevronLeft, Trash2, Edit3, Moon, Sun } from 'lucide-react';

// OpenRouter API Key - ضع مفتاح API الخاص بك هنا
const OPENROUTER_API_KEY = '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';

const MakkenyAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'محادثة جديدة', messages: 0, active: true },
  ]);
  const [editingChat, setEditingChat] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callOpenRouterAPI = async (message) => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Makkeny AI Chat'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-0528:free',
          messages: [
            {
              role: 'system',
              content: 'أنت مساعد ذكي لمنصة Makkeny للتطوير المهني والتدريب. ساعد المستخدمين في استفساراتهم حول التطوير المهني والتدريب.'
            },
            ...messages.map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      return 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await callOpenRouterAPI(inputText);
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'محادثة جديدة',
      messages: 0,
      active: true
    };
    setChatHistory(prev => [newChat, ...prev.map(chat => ({ ...chat, active: false }))]);
    setMessages([]);
  };

  const selectChat = (chatId) => {
    setChatHistory(prev => prev.map(chat => ({
      ...chat,
      active: chat.id === chatId
    })));
    setMessages([]);
  };

  const deleteChat = (chatId) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (chatHistory.find(chat => chat.id === chatId && chat.active)) {
      const remainingChats = chatHistory.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        selectChat(remainingChats[0].id);
      } else {
        startNewChat();
      }
    }
  };

  const startEditingChat = (chatId) => {
    setEditingChat(chatId);
  };

  const finishEditingChat = (chatId, newTitle) => {
    setChatHistory(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ));
    setEditingChat(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`chat-container ${darkMode ? 'dark' : ''}`} dir="rtl">
      <div className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle"
          title={sidebarOpen ? 'إغلاق الشريط الجانبي' : 'فتح الشريط الجانبي'}
        >
          {sidebarOpen ? <ChevronLeft className="icon" /> : <ChevronRight className="icon" />}
          <span className="tooltip">{sidebarOpen ? 'إغلاق الشريط الجانبي' : 'فتح الشريط الجانبي'}</span>
        </button>

        <div className="sidebar-content">
          <div className="header">
            <div className="logo-container">
              <div className="logo">
                
                 <Bot className="icon" />
              </div>
              <span className="title">Makkeny AI</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="theme-toggle"
              title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {darkMode ? <Sun className="icon sun" /> : <Moon className="icon moon" />}
            </button>
          </div>

          <div className="new-chat">
            <button onClick={startNewChat} className="new-chat-button">
              <Plus className="icon" />
              <span>محادثة جديدة</span>
            </button>
          </div>

          <div className="chat-history">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${chat.active ? 'active' : ''}`}
                onClick={() => selectChat(chat.id)}
              >
                <MessageSquare className="icon" />
                <div className="chat-info">
                  {editingChat === chat.id ? (
                    <input
                      type="text"
                      defaultValue={chat.title}
                      className="chat-title-input"
                      onBlur={(e) => finishEditingChat(chat.id, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          finishEditingChat(chat.id, e.target.value);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="chat-title">{chat.title}</div>
                      <div className="chat-messages">{chat.messages} رسالة</div>
                    </>
                  )}
                </div>
                <div className="chat-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingChat(chat.id);
                    }}
                    className="action-button"
                  >
                    <Edit3 className="icon" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="action-button"
                  >
                    <Trash2 className="icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="user-section">
            <div className="user-info">
              <div className="avatar">
                <User className="icon" />
              </div>
              <div className="user-details">
                <div className="user-name">المستخدم</div>
                <div className="user-account">الحساب الشخصي</div>
              </div>
              <Settings className="icon settings" />
            </div>
          </div>
        </div>
      </div>

      <div className="chat-area">
        <div className="header">
          <div className="chat-header">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="menu-button">
                <Menu className="icon" />
              </button>
            )}
            <div className="assistant-info">
              <div className="avatar">
                <Bot className="icon" />
              </div>
              <div className="details">
                <div className="assistant-name">Makkeny AI Assistant</div>
                <div className="assistant-status">متصل الآن</div>
              </div>
            </div>
          </div>
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div className="empty-chat">
              <div className="avatar large">
                <Bot className="icon" />
              </div>
              <h3 className="welcome-message">مرحباً بك في Makkeny AI</h3>
              <p className="welcome-text">
                أنا مساعدك الذكي للتطوير المهني والتدريب. كيف يمكنني مساعدتك اليوم؟
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type === 'user' ? 'user' : ''}`}>
              <div className={`avatar ${message.type === 'user' ? 'user' : ''}`}>
                {message.type === 'user' ? <User className="icon" /> : <Bot className="icon" />}
              </div>
              <div className="content-container">
                <div className={`content ${message.type === 'user' ? 'user' : ''}`}>
                  {message.content}
                </div>
                <div className="timestamp">
                  {message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message">
              <div className="avatar">
                <Bot className="icon" />
              </div>
              <div className="content-container">
                <div className="content loading">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-container">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className={`send-button ${!inputText.trim() || isLoading ? 'disabled' : ''}`}
            >
              <Send className="icon" />
            </button>
          </div>
          <div className="footer">مساعد Makkeny الذكي مدعوم بـ OpenRouter. قد يرتكب أخطاء، تحقق من المعلومات المهمة.</div>
        </div>
      </div>
    </div>
  );
};

export default MakkenyAIChat;