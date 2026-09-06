import { useState, useEffect } from 'react';
import { api } from '../api';

const WORK_TYPES = ['Water', 'Telecom', 'Electricity', 'Sewerage', 'Road Resurfacing', 'Drainage'];
const PRIORITIES = ['Emergency', 'High', 'Normal', 'Low'];
const CLOSURE_TYPES = ['None', 'Partial', 'Full'];

export default function WorkPlanning() {
  const [agencies, setAgencies] = useState([]);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    agency_id: '', work_type: '', road_name: '', location: '',
    start_date: '', end_date: '', duration: '', priority: 'Normal',
    closure_type: 'Partial', description: ''
  });

  useEffect(() => {
    api.getAgencies().then(setAgencies).catch(console.error);
  }, []);

  const update = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'start_date' || field === 'end_date') {
        if (next.start_date && next.end_date) {
          const days = Math.round((new Date(next.end_date) - new Date(next.start_date)) / 86400000) + 1;
          if (days > 0) next.duration = days;
        }
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.agency_id) errs.agency_id = 'Required';
    if (!form.work_type) errs.work_type = 'Required';
    if (!form.road_name.trim()) errs.road_name = 'Road name is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.start_date) errs.start_date = 'Required';
    if (!form.end_date) errs.end_date = 'Required';
    if (form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
      errs.end_date = 'End date cannot be before start date';
    }
    if (!form.priority) errs.priority = 'Required';
    if (!form.closure_type) errs.closure_type = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await api.createWork({
        ...form,
        agency_id: Number(form.agency_id),
        duration: Number(form.duration) || undefined
      });
      setNotification({ type: 'success', message: result.message });
      setForm({
        agency_id: '', work_type: '', road_name: '', location: '',
        start_date: '', end_date: '', duration: '', priority: 'Normal',
        closure_type: 'Partial', description: ''
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {notification && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      <div className="page-header">
        <h1>Work Planning & Submission</h1>
        <p className="subtitle">Submit planned infrastructure work for GIS mapping and coordination analysis.</p>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Agency</label>
            <select value={form.agency_id} onChange={e => update('agency_id', e.target.value)}>
              <option value="">Select agency...</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {errors.agency_id && <div className="form-error">{errors.agency_id}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Work Type</label>
              <select value={form.work_type} onChange={e => update('work_type', e.target.value)}>
                <option value="">Select type...</option>
                {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.work_type && <div className="form-error">{errors.work_type}</div>}
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => update('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Road Name</label>
              <input value={form.road_name} onChange={e => update('road_name', e.target.value)} placeholder="e.g. MG Road" />
              {errors.road_name && <div className="form-error">{errors.road_name}</div>}
            </div>
            <div className="form-group">
              <label>Location / Segment</label>
              <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Central Business District" />
              {errors.location && <div className="form-error">{errors.location}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} />
              {errors.start_date && <div className="form-error">{errors.start_date}</div>}
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)} />
              {errors.end_date && <div className="form-error">{errors.end_date}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (days)</label>
              <input type="number" value={form.duration} onChange={e => update('duration', e.target.value)} min="1" />
            </div>
            <div className="form-group">
              <label>Expected Road Closure</label>
              <select value={form.closure_type} onChange={e => update('closure_type', e.target.value)}>
                {CLOSURE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe the planned work..." />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Planned Work'}
          </button>
        </form>
      </div>
    </div>
  );
}
