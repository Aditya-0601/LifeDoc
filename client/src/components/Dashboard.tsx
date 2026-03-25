import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { documentsAPI, deadlinesAPI } from '../api/api';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import DeadlineList from './DeadlineList';
import DeadlineForm from './DeadlineForm';
import FamilyAccess from './FamilyAccess';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'documents' | 'deadlines' | 'family'>('documents');
  const [documents, setDocuments] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsRes, deadlinesRes] = await Promise.all([
        documentsAPI.getAll(),
        deadlinesAPI.getAll(true),
      ]);
      setDocuments(docsRes.data.documents);
      setDeadlines(deadlinesRes.data.deadlines);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = () => {
    loadData();
  };

  const handleDeadlineCreated = () => {
    loadData();
  };

  const handleDocumentDeleted = () => {
    loadData();
  };

  const handleDeadlineDeleted = () => {
    loadData();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🔐 LifeDoc</h1>
          <div className="header-right">
            <span className="user-name">Welcome, {user?.name}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => setActiveTab('documents')}
        >
          📄 Documents
        </button>
        <button
          className={activeTab === 'deadlines' ? 'active' : ''}
          onClick={() => setActiveTab('deadlines')}
        >
          ⏰ Deadlines
        </button>
        <button
          className={activeTab === 'family' ? 'active' : ''}
          onClick={() => setActiveTab('family')}
        >
          👨‍👩‍👧‍👦 Family Access
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'documents' && (
              <div>
                <DocumentUpload onUploaded={handleDocumentUploaded} />
                <DocumentList
                  documents={documents}
                  onDeleted={handleDocumentDeleted}
                />
              </div>
            )}

            {activeTab === 'deadlines' && (
              <div>
                <DeadlineForm onCreated={handleDeadlineCreated} documents={documents} />
                <DeadlineList
                  deadlines={deadlines}
                  onDeleted={handleDeadlineDeleted}
                />
              </div>
            )}

            {activeTab === 'family' && <FamilyAccess />}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
