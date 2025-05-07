import { useState, useRef, useEffect } from 'react';
import './App.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<FileInfo | null>(null);
  const [isPdfUploaded, setIsPdfUploaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if file is a PDF
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      
      setPdfFile(file);
      setPdfInfo({
        name: file.name,
        size: file.size,
        type: file.type
      });
      setIsPdfUploaded(true);
      setError(null);
      
      // Add a message from the bot acknowledging the PDF upload
      addMessage({
        id: Date.now().toString(),
        text: `PDF uploaded: ${file.name}. You can now ask questions about this document.`,
        sender: 'bot',
        timestamp: new Date()
      });
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // If PDF is not uploaded and we're not in the upload stage, show error
    if (!isPdfUploaded) {
      setError('Please upload a PDF file first');
      return;
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    addMessage(userMessage);
    setInputValue('');
    setIsLoading(true);
    
    // Simulate bot response (replace with actual API call to your backend)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I've analyzed the PDF "${pdfInfo?.name}". Based on the content, I can answer that your question about "${inputValue}" relates to specific information on pages 2-3 of the document. The answer is that [simulated response based on PDF content].`,
        sender: 'bot',
        timestamp: new Date()
      };
      
      addMessage(botMessage);
      setIsLoading(false);
    }, 1500);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      
      setPdfFile(file);
      setPdfInfo({
        name: file.name,
        size: file.size,
        type: file.type
      });
      setIsPdfUploaded(true);
      setError(null);
      
      addMessage({
        id: Date.now().toString(),
        text: `PDF uploaded: ${file.name}. You can now ask questions about this document.`,
        sender: 'bot',
        timestamp: new Date()
      });
    }
  };

  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Function to reset and upload a new PDF
  const handleNewPdf = () => {
    setPdfFile(null);
    setPdfInfo(null);
    setIsPdfUploaded(false);
    setMessages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>PDF Chatbot</h1>
        {isPdfUploaded && (
          <button onClick={handleNewPdf} className="new-pdf-button">
            Upload New PDF
          </button>
        )}
      </header>

      <main className="main-content">
        {!isPdfUploaded ? (
          <div 
            className="upload-container"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="upload-box">
              <h2>Upload a PDF Document</h2>
              <p>Drag and drop your PDF here or click to browse</p>
              <button 
                className="upload-button"
                onClick={handleSelectFileClick}
              >
                Select PDF File
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                style={{ display: 'none' }}
              />
              {error && <p className="error-message">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="chat-container">
            <div className="pdf-info">
              <div className="pdf-icon">PDF</div>
              <div className="pdf-details">
                <p className="pdf-name">{pdfInfo?.name}</p>
                <p className="pdf-size">{formatFileSize(pdfInfo?.size || 0)}</p>
              </div>
            </div>

            <div className="messages-container">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-content">
                    <p>{message.text}</p>
                    <span className="message-time">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message bot-message">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="input-form">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question about the PDF..."
                className="message-input"
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={isLoading || !inputValue.trim()}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;