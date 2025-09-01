/**
 * 图片上传组件
 */
import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const UploadContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 2px dashed #007bff;
  border-radius: 8px;
  background: ${props => props.dragActive ? '#e3f2fd' : 'white'};
  color: #007bff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #e3f2fd;
    border-color: #0056b3;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ImagePreview = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: #dc3545;
    transform: scale(1.1);
  }
`;

const UploadInfo = styled.div`
  font-size: 11px;
  color: #6c757d;
  margin-top: 4px;
`;

const ImageUpload = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 1, 
  maxFileSize = 5 * 1024 * 1024, // 5MB
  accept = "image/jpeg,image/png,image/gif,image/webp",
  disabled = false 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];

    fileArray.forEach(file => {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('只能上传图片文件');
        return;
      }

      // 检查文件大小
      if (file.size > maxFileSize) {
        alert(`图片文件大小不能超过 ${Math.round(maxFileSize / 1024 / 1024)}MB`);
        return;
      }

      // 检查数量限制
      if (images.length + validFiles.length >= maxImages) {
        alert(`最多只能上传 ${maxImages} 张图片`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      // 创建文件预览
      const newImages = validFiles.map(file => ({
        id: Date.now() + Math.random(),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      }));

      onImagesChange([...images, ...newImages]);
    }
  };

  // 处理点击上传
  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // 处理文件输入变化
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = '';
  };

  // 处理拖拽
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  // 移除图片
  const handleRemoveImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    // 释放对象URL
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove && imageToRemove.url) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    onImagesChange(updatedImages);
  };

  const canUploadMore = images.length < maxImages;

  return (
    <UploadContainer>
      {canUploadMore && (
        <UploadButton
          onClick={handleUploadClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          dragActive={dragActive}
          disabled={disabled}
        >
          {dragActive ? (
            <ImageIcon size={16} />
          ) : (
            <Upload size={16} />
          )}
          {dragActive ? '释放上传' : '上传图片'}
          
          <HiddenInput
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={maxImages > 1}
            onChange={handleFileInputChange}
          />
        </UploadButton>
      )}

      <ImagePreviewContainer>
        {images.map((image) => (
          <ImagePreview key={image.id}>
            <PreviewImage src={image.url} alt={image.name} />
            <RemoveButton onClick={() => handleRemoveImage(image.id)}>
              <X size={12} />
            </RemoveButton>
          </ImagePreview>
        ))}
      </ImagePreviewContainer>

      {images.length > 0 && (
        <UploadInfo>
          {images.length}/{maxImages} 张图片
          {images.map(img => (
            <div key={img.id}>
              {img.name} ({Math.round(img.size / 1024)}KB)
            </div>
          ))}
        </UploadInfo>
      )}
    </UploadContainer>
  );
};

export default ImageUpload;