import { useState } from 'react';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import TextAreaField from './ui/TextAreaField';
import { canModerateComment } from '../utils/permissions';
import { formatDateTime, initialsFromName } from '../utils/formatters';
import styles from './CommentsSection.module.css';

function CommentsSection({ comments, currentUser, projectRole, onCreateComment, onUpdateComment, onDeleteComment }) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyCommentId, setBusyCommentId] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const canComment = Boolean(projectRole);

  async function handleCreateComment(event) {
    event.preventDefault();

    if (!newComment.trim()) {
      setSubmitError('Comment content is required.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      await onCreateComment({ content: newComment.trim() });
      setNewComment('');
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveComment(commentId) {
    if (!editingContent.trim()) {
      setSubmitError('Comment content is required.');
      return;
    }

    try {
      setBusyCommentId(commentId);
      setSubmitError('');
      await onUpdateComment(commentId, { content: editingContent.trim() });
      setEditingCommentId(null);
      setEditingContent('');
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setBusyCommentId(null);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm('Delete this comment?')) {
      return;
    }

    try {
      setBusyCommentId(commentId);
      await onDeleteComment(commentId);
    } finally {
      setBusyCommentId(null);
    }
  }

  return (
    <section className="card card--padded">
      <div className="section-header">
        <div>
          <h2>Comments</h2>
          <p>Capture decisions, unblock teammates, and keep task discussion close to the work.</p>
        </div>
      </div>

      {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

      {canComment ? (
        <form className={styles.form} onSubmit={handleCreateComment}>
          <TextAreaField
            label="Add a comment"
            name="comment"
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Share an update, ask a question, or leave implementation notes."
            rows={4}
            value={newComment}
          />
          <div className="form-actions">
            <Button loading={submitting} type="submit">
              Post Comment
            </Button>
          </div>
        </form>
      ) : null}

      {!comments.length ? (
        <EmptyState
          description="Comments added here will stay visible inside the task detail view for the whole project team."
          title="No discussion yet"
        />
      ) : (
        <div className="task-list">
          {comments.map((comment) => {
            const isAuthor = comment.author?.id === currentUser?.id;
            const canDelete = canModerateComment(comment, currentUser, projectRole);
            const isEditing = editingCommentId === comment.id;

            return (
              <article className="comment-card" key={comment.id}>
                <div className="split-row">
                  <div className="media-row">
                    <span className="avatar-chip">{initialsFromName(comment.author?.fullName)}</span>
                    <div>
                      <strong>{comment.author?.fullName}</strong>
                      <div className="comment-meta">{formatDateTime(comment.updatedAt || comment.createdAt)}</div>
                    </div>
                  </div>

                  <div className="inline-actions">
                    {isAuthor ? (
                      <Button
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingContent(comment.content);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Edit
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        disabled={busyCommentId === comment.id}
                        onClick={() => handleDeleteComment(comment.id)}
                        size="sm"
                        variant="danger"
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>

                {isEditing ? (
                  <div className={styles.editArea}>
                    <TextAreaField
                      label="Edit comment"
                      name={`comment-${comment.id}`}
                      onChange={(event) => setEditingContent(event.target.value)}
                      rows={4}
                      value={editingContent}
                    />
                    <div className="form-actions">
                      <Button
                        disabled={busyCommentId === comment.id}
                        onClick={() => handleSaveComment(comment.id)}
                        size="sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingContent('');
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.body}>{comment.content}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CommentsSection;
