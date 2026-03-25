import React, { useState } from 'react';
import { documentsAPI } from '../api/api';
import './DocumentList.css';

interface DocumentListProps {
  documents: any[];
  onDeleted: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDeleted }) => {
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categories = [
    { value: '', label: 'All Categories' },
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

  const filteredDocuments = filterCategory
    ? documents.filter((doc) => doc.category === filterCategory)
    : documents;

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(id);
    try {
      await documentsAPI.delete(id);
      onDeleted();
    } catch (error) {
      alert('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      aadhaar: '🆔',
      pan: '💳',
      driving_license: '🚗',
      passport: '📘',
      certificate: '🎓',
      medical: '🏥',
      insurance: '🛡️',
      property: '🏠',
      bank: '🏦',
      other: '📄',
    };
    return icons[category] || '📄';
  };

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  if (documents.length === 0) {
    return (
      <div className="document-list">
        <div className="empty-state">
          <p>No documents uploaded yet. Upload your first document above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h2>Your Documents ({documents.length})</h2>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="category-filter"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="documents-grid">
        {filteredDocuments.map((doc) => (
          <div key={doc.id} className="document-card">
            <div className="document-card-header">
              <span className="document-icon">{getCategoryIcon(doc.category)}</span>
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="delete-btn"
              >
                {deletingId === doc.id ? '...' : '🗑️'}
              </button>
            </div>
            <h3>{doc.title}</h3>
            <p className="document-category">{doc.category.replace('_', ' ')}</p>
            {doc.description && <p className="document-description">{doc.description}</p>}
            <div className="document-actions">
              <a
                href={`${API_URL}${doc.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="view-btn"
              >
                View Document
              </a>
            </div>
            <p className="document-date">
              Uploaded: {new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;
