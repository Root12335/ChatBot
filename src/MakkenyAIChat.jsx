import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Settings, User, Bot, Menu, X, Trash2, Edit3, Moon, Sun, Sparkles, Zap, Coffee } from 'lucide-react';

const MakkenyAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'محادثة جديدة', messages: 0, active: true, timestamp: new Date() },
  ]);
  const [editingChat, setEditingChat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const callOpenRouterAPI = async (message) => {
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenRouter API key not found. Please add VITE_OPENROUTER_API_KEY to your .env file.');
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Makkeny AI Chat'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-0528:free',
          messages: [
            {
              role: 'system',
              content: 'أنت مساعد ذكي لمنصة Makkeny للتطوير المهني والتدريب. ساعد المستخدمين في استفساراتهم حول التطوير المهني والتدريب بطريقة مفيدة ومهنية.'
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
      if (error.message.includes('API key not found')) {
        return 'خطأ في التكوين: مفتاح API غير موجود. يرجى التحقق من إعدادات التطبيق.';
      }
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
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    // Update chat history with message count and title
    setChatHistory(prev => prev.map(chat => 
      chat.active ? { 
        ...chat, 
        messages: chat.messages + 1,
        title: chat.messages === 0 ? currentInput.slice(0, 30) + (currentInput.length > 30 ? '...' : '') : chat.title
      } : chat
    ));

    try {
      const aiResponse = await callOpenRouterAPI(currentInput);
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      setChatHistory(prev => prev.map(chat => 
        chat.active ? { ...chat, messages: chat.messages + 1 } : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
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
      active: true,
      timestamp: new Date()
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
    setChatHistory(prev => {
      const filteredChats = prev.filter(chat => chat.id !== chatId);
      if (filteredChats.length === 0) {
        return [{
          id: Date.now(),
          title: 'محادثة جديدة',
          messages: 0,
          active: true,
          timestamp: new Date()
        }];
      }
      return filteredChats;
    });
    
    const deletedChat = chatHistory.find(chat => chat.id === chatId);
    if (deletedChat && deletedChat.active) {
      const remainingChats = chatHistory.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        selectChat(remainingChats[0].id);
      } else {
        setMessages([]);
      }
    }
  };

  const startEditingChat = (chatId) => {
    setEditingChat(chatId);
  };

  const finishEditingChat = (chatId, newTitle) => {
    if (newTitle.trim()) {
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
      ));
    }
    setEditingChat(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'اليوم';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-EG');
    }
  };

  const quickPrompts = [
    { icon: Sparkles, text: 'ساعدني في تطوير مهاراتي المهنية', color: 'from-purple-500 to-pink-500' },
    { icon: Zap, text: 'أريد خطة تدريبية شخصية', color: 'from-blue-500 to-cyan-500' },
    { icon: Coffee, text: 'نصائح لتحسين الإنتاجية', color: 'from-orange-500 to-red-500' }
  ];

  return (
    <div className={`chat-container ${darkMode ? 'dark' : ''}`} dir="rtl">
      {/* Sidebar */}
      <div className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>
        <div className="sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <div className="logo-section">
              <div className="logo-gradient">
                <Bot className="logo-icon" />
              </div>
              <div className="logo-text">
                <h1 className="app-title">Makkeny AI</h1>
                <p className="app-subtitle">مساعدك الذكي</p>
              </div>
            </div>
            <div className="header-actions">
              <button onClick={toggleDarkMode} className="theme-toggle" title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}>
                {darkMode ? <Sun className="theme-icon" /> : <Moon className="theme-icon" />}
              </button>
              <button onClick={() => setSidebarOpen(false)} className="close-sidebar md:hidden">
                <X className="close-icon" />
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="new-chat-section">
            <button onClick={startNewChat} className="new-chat-btn">
              <div className="new-chat-icon">
                <Plus className="plus-icon" />
              </div>
              <span className="new-chat-text">محادثة جديدة</span>
              <div className="new-chat-glow"></div>
            </button>
          </div>

          {/* Chat History */}
          <div className="chat-history">
            <div className="history-header">
              <MessageSquare className="history-icon" />
              <span className="history-title">المحادثات السابقة</span>
            </div>
            <div className="chat-list">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-item ${chat.active ? 'active' : ''}`}
                  onClick={() => selectChat(chat.id)}
                >
                  <div className="chat-item-content">
                    <div className="chat-icon-wrapper">
                      <MessageSquare className="chat-icon" />
                    </div>
                    <div className="chat-details">
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
                          <div className="chat-meta">
                            <span className="message-count">{chat.messages} رسالة</span>
                            <span className="chat-date">{formatDate(chat.timestamp)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="chat-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingChat(chat.id);
                      }}
                      className="action-btn edit-btn"
                      title="تعديل العنوان"
                    >
                      <Edit3 className="action-icon" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="action-btn delete-btn"
                      title="حذف المحادثة"
                    >
                      <Trash2 className="action-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Section */}
          <div className="user-section">
            <div className="user-card" onClick={() => setShowSettings(!showSettings)}>
              <div className="user-avatar">
                <User className="user-icon" />
              </div>
              <div className="user-info">
                <div className="user-name">المستخدم</div>
                <div className="user-status">متصل الآن</div>
              </div>
              <Settings className="settings-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <div className="header-left">
            <button onClick={() => setSidebarOpen(true)} className="menu-btn">
              <Menu className="menu-icon" />
            </button>
            <div className="assistant-info">
              <div className="assistant-avatar">
                <Bot className="assistant-icon" />
                <div className="status-indicator"></div>
              </div>
              <div className="assistant-details">
                <h2 className="assistant-name">Makkeny AI Assistant</h2>
                <p className="assistant-status">متصل ومستعد للمساعدة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-content">
                <div className="welcome-avatar">
                  <Bot className="welcome-icon" />
                  <div className="avatar-glow"></div>
                </div>
                <h1 className="welcome-title">مرحباً بك في Makkeny AI</h1>
                <p className="welcome-description">
                  أنا مساعدك الذكي للتطوير المهني والتدريب. اختر من الاقتراحات أدناه أو اكتب سؤالك مباشرة
                </p>
                
                <div className="quick-prompts">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputText(prompt.text)}
                      className="quick-prompt"
                    >
                      <div className={`prompt-icon bg-gradient-to-r ${prompt.color}`}>
                        <prompt.icon className="prompt-icon-svg" />
                      </div>
                      <span className="prompt-text">{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message, index) => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-avatar">
                    {message.type === 'user' ? (
                      <User className="avatar-icon" />
                    ) : (
                      <Bot className="avatar-icon" />
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      <div className="message-text">{message.content}</div>
                    </div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message assistant">
                  <div className="message-avatar">
                    <Bot className="avatar-icon" />
                  </div>
                  <div className="message-content">
                    <div className="message-bubble loading">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-section">
          <div className="input-wrapper">
            <div className="input-container">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب رسالتك هنا..."
                className="message-input"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className={`send-btn ${!inputText.trim() || isLoading ? 'disabled' : 'active'}`}
              >
                <Send className="send-icon" />
                <div className="send-glow"></div>
              </button>
            </div>
            <div className="input-footer">
              <p className="disclaimer">
                مساعد Makkeny الذكي مدعوم بـ OpenRouter. قد يرتكب أخطاء، تحقق من المعلومات المهمة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakkenyAIChat;