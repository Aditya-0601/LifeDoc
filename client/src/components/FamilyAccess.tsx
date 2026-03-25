import React, { useState, useEffect } from 'react';
import { familyAPI } from '../api/api';
import './FamilyAccess.css';

const FamilyAccess: React.FC = () => {
  const [accesses, setAccesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [familyMemberEmail, setFamilyMemberEmail] = useState('');
  const [familyMemberName, setFamilyMemberName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAccesses();
  }, []);

  const loadAccesses = async () => {
    try {
      setLoading(true);
      const response = await familyAPI.getAllAccess();
      setAccesses(response.data.accesses);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load family access');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await familyAPI.createAccess(familyMemberEmail, familyMemberName);
      setFamilyMemberEmail('');
      setFamilyMemberName('');
      setShowForm(false);
      loadAccesses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create family access');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await familyAPI.updateAccess(id, !isActive);
      loadAccesses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update access');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this family access?')) {
      return;
    }

    try {
      await familyAPI.deleteAccess(id);
      loadAccesses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete access');
    }
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Access code copied to clipboard!');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="family-access">
      <div className="family-access-header">
        <div>
          <h2>Emergency Family Access</h2>
          <p className="subtitle">
            Grant trusted family members emergency access to your documents using a secure access code.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="add-btn">
          {showForm ? 'Cancel' : '+ Add Family Member'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="family-access-form">
          <h3>Add Family Member</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Family Member Name *</label>
              <input
                type="text"
                value={familyMemberName}
                onChange={(e) => setFamilyMemberName(e.target.value)}
                required
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="form-group">
              <label>Family Member Email *</label>
              <input
                type="email"
                value={familyMemberEmail}
                onChange={(e) => setFamilyMemberEmail(e.target.value)}
                required
                placeholder="family@example.com"
              />
            </div>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Access Code'}
            </button>
          </form>
        </div>
      )}

      <div className="access-list">
        {accesses.length === 0 ? (
          <div className="empty-state">
            <p>No family access configured yet. Add a family member above to get started.</p>
            <div className="info-box">
              <h4>How it works:</h4>
              <ol>
                <li>Add a trusted family member</li>
                <li>Share the generated access code with them securely</li>
                <li>In an emergency, they can use the code to access your documents</li>
                <li>You can deactivate or delete access at any time</li>
              </ol>
            </div>
          </div>
        ) : (
          accesses.map((access) => (
            <div key={access.id} className="access-card">
              <div className="access-card-header">
                <div>
                  <h3>{access.family_member_name}</h3>
                  <p className="access-email">{access.family_member_email}</p>
                </div>
                <div className={`status-badge ${access.is_active ? 'active' : 'inactive'}`}>
                  {access.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="access-code-section">
                <label>Access Code:</label>
                <div className="access-code-display">
                  <code>{access.access_code}</code>
                  <button
                    onClick={() => copyAccessCode(access.access_code)}
                    className="copy-btn"
                    title="Copy access code"
                  >
                    📋 Copy
                  </button>
                </div>
                <p className="access-code-note">
                  Share this code securely with {access.family_member_name}. They can use it to access your documents in an emergency.
                </p>
              </div>

              <div className="access-card-footer">
                <button
                  onClick={() => handleToggleActive(access.id, access.is_active === 1)}
                  className={`toggle-btn ${access.is_active ? 'deactivate' : 'activate'}`}
                >
                  {access.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(access.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>

              <p className="access-date">
                Created: {new Date(access.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FamilyAccess;
