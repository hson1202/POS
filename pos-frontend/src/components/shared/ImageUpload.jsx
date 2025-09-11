import React, { useState } from 'react';
import { FaUpload, FaTimes } from 'react-icons/fa';

const ImageUpload = ({ onImageChange, currentImage = '' }) => {
  const [preview, setPreview] = useState(currentImage);
  const [isDragging, setIsDragging] = useState(false);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Tính toán kích thước mới (tối đa 800px)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Vẽ hình ảnh với kích thước mới
        ctx.drawImage(img, 0, 0, width, height);
        
        // Chuyển đổi thành Base64 với chất lượng 0.8
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file) => {
    if (file && file.type.startsWith('image/')) {
      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Hình ảnh quá lớn. Vui lòng chọn hình ảnh nhỏ hơn 5MB.');
        return;
      }
      
      try {
        const compressedImage = await compressImage(file);
        setPreview(compressedImage);
        onImageChange(compressedImage);
      } catch (error) {
        console.error('Lỗi khi nén hình ảnh:', error);
        // Fallback: sử dụng hình ảnh gốc
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target.result;
          setPreview(imageData);
          onImageChange(imageData);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeImage = () => {
    setPreview('');
    onImageChange('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-[#ababab] mb-2">Hình ảnh món ăn</label>
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-lg border-2 border-[#3a3a3a]"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
          >
            <FaTimes size={12} />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-[#F6B100] bg-[#F6B100] bg-opacity-10' 
              : 'border-[#3a3a3a] hover:border-[#F6B100]'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FaUpload className="mx-auto text-4xl text-[#ababab] mb-4" />
          <p className="text-[#ababab] mb-2">
            Kéo thả hình ảnh vào đây hoặc click để chọn
          </p>
          <p className="text-xs text-[#666]">
            Hỗ trợ: JPG, PNG, GIF (Tối đa 5MB)
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="inline-block mt-4 px-4 py-2 bg-[#F6B100] text-[#1f1f1f] rounded-lg cursor-pointer hover:bg-[#e6a100] transition-colors"
          >
            Chọn hình ảnh
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 