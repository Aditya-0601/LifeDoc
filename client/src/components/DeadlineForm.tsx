import React, { useState } from 'react';
import { deadlinesAPI } from '../api/api';
import './DeadlineForm.css';

interface DeadlineFormProps {
  onCreated: () => void;
  documents: any[];
}

const DeadlineForm: React.FC<DeadlineFormProps> = ({ onCreated, documents }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [reminderDays, setReminderDays] = useState(30);
  const [category, setCategory] = useState('other');
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'insurance', label: 'Insurance Renewal' },
    { value: 'license', label: 'License Expiry' },
    { value: 'exam', label: 'Exam Form' },
    { value: 'fee', label: 'Fee Payment' },
    { value: 'passport', label: 'Passport Expiry' },
    { value: 'medicine', label: 'Medicine Refill' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineDate) {
      setError('Please select a deadline date');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await deadlinesAPI.create({
        title,
        description,
        deadline_date: deadlineDate,
        reminder_days: reminderDays,
        category,
        document_id: documentId || null,
      });
      setTitle('');
      setDescription('');
      setDeadlineDate('');
      setReminderDays(30);
      setCategory('other');
      setDocumentId(null);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create deadline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deadline-form">
      <h2>Create Deadline</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Insurance Renewal"
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

        <div className="form-row">
          <div className="form-group">
            <label>Deadline Date *</label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Remind me (days before)</label>
            <input
              type="number"
              value={reminderDays}
              onChange={(e) => setReminderDays(parseInt(e.target.value) || 30)}
              min="1"
              max="365"
            />
          </div>
        </div>

        {documents.length > 0 && (
          <div className="form-group">
            <label>Link to Document (Optional)</label>
            <select
              value={documentId || ''}
              onChange={(e) => setDocumentId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">None</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({doc.category})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes"
            rows={3}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Deadline'}
        </button>
      </form>
    </div>
  );
};

export default DeadlineForm;
