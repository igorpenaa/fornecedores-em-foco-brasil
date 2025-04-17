
import React, { useState } from 'react';
import SHA1 from 'crypto-js/sha1';
import { enc } from 'crypto-js';
import { Button } from "@/components/ui/button";
import { Loader2, X, Upload } from "lucide-react";

// Configuração do Cloudinary
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/di1blafqh/image/upload';
const CLOUDINARY_API_KEY = '519761752284611';
const CLOUDINARY_API_SECRET = 'jAMBp7el-xqcl0xKmRZ0QITbFeM';

interface CloudinaryUploaderProps {
  onUploadSuccess: (url: string, mediaType: 'image' | 'video') => void;
  onUploadError: (error: string) => void;
  mediaType: 'image' | 'video';
  initialPreview?: string;
  maxSizeMB?: number;
  folder?: string;
}

export function CloudinaryUploader({
  onUploadSuccess,
  onUploadError,
  mediaType,
  initialPreview,
  maxSizeMB = 10,
  folder = 'highlights'
}: CloudinaryUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [loading, setLoading] = useState(false);

  // Gerar assinatura SHA-1
  const generateSHA1 = (message: string) => {
    return SHA1(message).toString(enc.Hex);
  };

  // Gerar assinatura para Cloudinary
  const generateSignature = (publicId: string, timestamp: number) => {
    const params = {
      public_id: publicId,
      timestamp: timestamp,
      folder: folder
    };
    
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key as keyof typeof params]}`)
      .join('&');

    return generateSHA1(paramString + CLOUDINARY_API_SECRET);
  };

  // Manipular seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tamanho
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      onUploadError(`O arquivo deve ter no máximo ${maxSizeMB}MB`);
      return;
    }

    // Validar tipo
    if (mediaType === 'image' && !selectedFile.type.startsWith('image/')) {
      onUploadError(`Apenas arquivos de imagem são permitidos`);
      return;
    }

    if (mediaType === 'video' && !selectedFile.type.startsWith('video/')) {
      onUploadError(`Apenas arquivos de vídeo são permitidos`);
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  // Realizar upload
  const handleUpload = async () => {
    if (!file) {
      onUploadError('Selecione um arquivo para upload');
      return;
    }

    setLoading(true);
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const fileName = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_'); // Remove extensão e espaços
      const publicId = `${folder}/${fileName}-${timestamp}`;
      const signature = generateSignature(publicId, timestamp);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('public_id', publicId);
      formData.append('folder', folder);

      console.log('Enviando para Cloudinary:', {
        url: CLOUDINARY_URL,
        publicId,
        timestamp
      });

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erro no upload');
      }

      const data = await response.json();
      console.log('Resposta do Cloudinary:', data);
      onUploadSuccess(data.secure_url, mediaType);
    } catch (error) {
      console.error('Erro no upload:', error);
      onUploadError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Remover arquivo
  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    if (preview && preview !== initialPreview) URL.revokeObjectURL(preview);
  };

  return (
    <div className="w-full">
      {/* Visualização da mídia */}
      {preview && (
        <div className="mb-4 relative border rounded-md overflow-hidden">
          {mediaType === 'image' ? (
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          ) : (
            <video src={preview} className="w-full h-48 object-cover" controls />
          )}
          <Button
            type="button"
            onClick={handleRemove}
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remover</span>
          </Button>
        </div>
      )}

      {/* Input de arquivo */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <label className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-1 text-sm text-gray-500">
                Clique para selecionar um arquivo {mediaType === 'image' ? 'de imagem' : 'de vídeo'}
              </p>
              <p className="mt-1 text-xs text-gray-400">Máximo {maxSizeMB}MB</p>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={mediaType === 'image' ? "image/*" : "video/*"}
            />
          </label>
        </div>

        {/* Botão de upload */}
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="md:self-end"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
