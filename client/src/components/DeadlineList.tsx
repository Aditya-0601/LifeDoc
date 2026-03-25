import React, { useState } from 'react';
import { deadlinesAPI } from '../api/api';
import './DeadlineList.css';

interface DeadlineListProps {
  deadlines: any[];
  onDeleted: () => void;
}

const DeadlineList: React.FC<DeadlineListProps> = ({ deadlines, onDeleted }) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this deadline?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deadlinesAPI.delete(id);
      onDeleted();
    } catch (error) {
      alert('Failed to delete deadline');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleComplete = async (id: number, isCompleted: boolean) => {
    setCompletingId(id);
    try {
      await deadlinesAPI.update(id, { is_completed: !isCompleted });
      onDeleted(); // Reload list
    } catch (error) {
      alert('Failed to update deadline');
    } finally {
      setCompletingId(null);
    }
  };

  const getDaysUntil = (deadlineDate: string) => {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      insurance: '🛡️',
      license: '🚗',
      exam: '📝',
      fee: '💰',
      passport: '📘',
      medicine: '💊',
      other: '📅',
    };
    return icons[category] || '📅';
  };

  const getUrgencyClass = (days: number) => {
    if (days < 0) return 'overdue';
    if (days <= 7) return 'urgent';
    if (days <= 30) return 'soon';
    return 'normal';
  };

  if (deadlines.length === 0) {
    return (
      <div className="deadline-list">
        <div className="empty-state">
          <p>No deadlines set. Create your first deadline above!</p>
        </div>
      </div>
    );
  }

  const sortedDeadlines = [...deadlines].sort((a, b) => {
    const daysA = getDaysUntil(a.deadline_date);
    const daysB = getDaysUntil(b.deadline_date);
    return daysA - daysB;
  });

  return (
    <div className="deadline-list">
      <h2>Upcoming Deadlines ({deadlines.length})</h2>
      <div className="deadlines-container">
        {sortedDeadlines.map((deadline) => {
          const daysUntil = getDaysUntil(deadline.deadline_date);
          const urgencyClass = getUrgencyClass(daysUntil);
          const isOverdue = daysUntil < 0;
          const isCompleted = deadline.is_completed === 1;

          return (
            <div
              key={deadline.id}
              className={`deadline-card ${urgencyClass} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="deadline-card-header">
                <span className="deadline-icon">{getCategoryIcon(deadline.category)}</span>
                <div className="deadline-actions">
                  <button
                    onClick={() => handleToggleComplete(deadline.id, isCompleted)}
                    disabled={completingId === deadline.id}
                    className={`complete-btn ${isCompleted ? 'completed' : ''}`}
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isCompleted ? '✓' : '○'}
                  </button>
                  <button
                    onClick={() => handleDelete(deadline.id)}
                    disabled={deletingId === deadline.id}
                    className="delete-btn"
                  >
                    {deletingId === deadline.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>

              <h3>{deadline.title}</h3>
              <p className="deadline-category">{deadline.category.replace('_', ' ')}</p>

              <div className="deadline-date-info">
                <span className="deadline-date">
                  {new Date(deadline.deadline_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className={`days-until ${urgencyClass}`}>
                  {isOverdue
                    ? `${Math.abs(daysUntil)} days overdue`
                    : daysUntil === 0
                    ? 'Due today!'
                    : `${daysUntil} days remaining`}
                </span>
              </div>

              {deadline.description && (
                <p className="deadline-description">{deadline.description}</p>
              )}

              {deadline.document_title && (
                <div className="linked-document">
                  📄 Linked: {deadline.document_title}
                </div>
              )}

              <div className="reminder-info">
                Reminder: {deadline.reminder_days} days before
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeadlineList;
