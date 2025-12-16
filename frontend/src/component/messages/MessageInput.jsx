import React, { useState, useRef } from 'react';
import { BsSend, BsImage, BsCameraVideo, BsX } from "react-icons/bs";
import useConversation from '../../zustand/useConversation';
import toast from 'react-hot-toast';

const MessageInput = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'video'
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const { selectedConversation, messages, setMessages } = useConversation();


  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh không được vượt quá 5MB");
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setFileType('image');
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video không được vượt quá 50MB");
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setFileType('video');
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            toast.error("Ảnh không được vượt quá 5MB");
            return;
          }
          setSelectedFile(file);
          setFilePreview(URL.createObjectURL(file));
          setFileType('image');
        }
        break;
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || !selectedConversation) return;
    setLoading(true);
    try {
      const isGroupChat = selectedConversation.isGroupChat;
      const apiUrl = isGroupChat
        ? `/messages/send-group/${selectedConversation._id}`
        : `/messages/send/${selectedConversation.otherUser._id}`;

      const formData = new FormData();
      formData.append('message', message);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([...messages, data.message]);
      setMessage("");
      removeFile();

    } catch (error) {
      toast.error(error.message || "Gửi tin nhắn thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="px-4 my-3" onSubmit={handleSendMessage}>
      {/* File Preview */}
      {filePreview && (
        <div className="mb-3 relative inline-block">
          {fileType === 'image' ? (
            <img 
              src={filePreview} 
              alt="Preview" 
              className="max-h-32 rounded-lg border-2 border-gray-600"
            />
          ) : (
            <video 
              src={filePreview} 
              className="max-h-32 rounded-lg border-2 border-gray-600"
              controls
            />
          )}
          <button
            type="button"
            onClick={removeFile}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <BsX className="text-xl" />
          </button>
        </div>
      )}

      <div className="w-full relative flex gap-2">
        {/* Image Upload Button */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="btn btn-circle bg-gray-600 hover:bg-gray-500 border-none"
          disabled={loading}
          title="Gửi ảnh"
        >
          <BsImage className="text-xl text-white" />
        </button>

        {/* Video Upload Button */}
        <input
          type="file"
          ref={videoInputRef}
          onChange={handleVideoSelect}
          accept="video/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="btn btn-circle bg-purple-600 hover:bg-purple-500 border-none"
          disabled={loading}
          title="Gửi video"
        >
          <BsCameraVideo className="text-xl text-white" />
        </button>

        {/* Message Input */}
        <input
          type="text"
          placeholder="Gửi tin nhắn hoặc Ctrl+V để dán ảnh..."
          onChange={e => setMessage(e.target.value)}
          onPaste={handlePaste}
          value={message}
          className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 text-white"
        />

        {/* Send Button */}
        <button
          type="submit"
          className="btn btn-circle bg-blue-600 hover:bg-blue-500 border-none"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <BsSend className="text-xl text-white" />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
