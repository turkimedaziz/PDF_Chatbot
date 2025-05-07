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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getPdfAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      if (file.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !pdfFile) return;

    addMessage({
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    });

    setInputValue('');
    setIsLoading(true);

    try {
      const base64Pdf = await getPdfAsBase64(pdfFile);
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputValue,
          pdf: base64Pdf
        })
      });

      const data = await response.json();
      addMessage({
        id: Date.now().toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date()
      });
    } catch (err) {
      setError('Failed to get response from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleNewPdf = () => {
    setPdfFile(null);
    setPdfInfo(null);
    setIsPdfUploaded(false);
    setMessages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      handleFileChange({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const formatFileSize = (bytes: number): string => {
    return bytes < 1024
      ? `${bytes} bytes`
      : bytes < 1048576
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / 1048576).toFixed(1)} MB`;
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
              <button onClick={handleSelectFileClick} className="upload-button">
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
                      <span></span><span></span><span></span>
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
              <button type="submit" className="send-button" disabled={isLoading || !inputValue.trim()}>
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
