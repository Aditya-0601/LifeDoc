import React, { useState } from 'react';
import { documentsAPI } from '../api/api';
import './DocumentUpload.css';

interface DocumentUploadProps {
  onUploaded: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'aadhaar', label: 'Aadhaar' },
    { value: 'pan', label: 'PAN' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'passport', label: 'Passport' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'medical', label: 'Medical Report' },
    { value: 'insurance', label: 'Insurance Policy' },
    { value: 'property', label: 'Property Papers' },
    { value: 'bank', label: 'Bank Documents' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('category', category);
      formData.append('description', description);

      await documentsAPI.upload(formData);
      setFile(null);
      setTitle('');
      setDescription('');
      setCategory('other');
      onUploaded();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-upload">
      <h2>Upload Document</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept="image/*,.pdf,.doc,.docx"
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title (optional)"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
          />
        </div>
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
};

export default DocumentUpload;
