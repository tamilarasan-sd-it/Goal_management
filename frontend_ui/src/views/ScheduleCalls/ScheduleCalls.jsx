import { useEffect, useState, forwardRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { addAction, fetchAction, updateAction } from '../../StoreRedux/actions/commonActions';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { Backdrop, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Slide,
} from '@mui/material';

// Animated slide-up transition for the modal
const SlideTransition = forwardRef(function SlideTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const getScheduleCallDetails = createSelector(
  state => state?.dataService?.pages,
  (pages) => {
    const result = {};
    const pageNames = ['schedule_calls'];
    pageNames.forEach(page => {
      const pageData = pages?.[page];
      const scheduleCallLoad = pageData?.loading?.scheduleCallLoad;
      const scheduleCallData = pageData?.data?.scheduleCallData;

      result[page] = {
        loading: {
          scheduleCallLoad: scheduleCallLoad,
        },
        data: {
          scheduleCallData: scheduleCallData,
        }
      };
    });
    return result.schedule_calls;
  }
);

const ScheduleCalls = () => {
  const dispatch = useDispatch();
  const [fhDate, setFhDate] = useState("");
  const [tlDate, setTlDate] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [scheduleIds, setScheduleIds] = useState({ fhId: null, tlId: null });

  // Which review type is being edited: 'fh' | 'manager' | 'both' | null
  const [editScope, setEditScope] = useState(null);

  // Modify-schedule modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingChoice, setPendingChoice] = useState('');
  const [modalAlert, setModalAlert] = useState(''); // shows an animated inline warning inside the modal

  const scheduleCallDetails = useSelector(getScheduleCallDetails);
  const hasExistingData = Array.isArray(scheduleCallDetails?.data?.scheduleCallData) && scheduleCallDetails.data.scheduleCallData.length > 0;

  useEffect(() => {
    dispatch(setLoading("schedule_calls", "scheduleCallLoad", true))
    dispatch(fetchAction('application/json', 'schedule_calls', 'scheduleCallData', 'scheduleCallLoad'));
  }, [dispatch])

  useEffect(() => {
    if (hasExistingData) {
      const scheduleData = scheduleCallDetails.data.scheduleCallData;
      console.log(scheduleData);

      const fhSchedule = scheduleData.find(s => s.mail_type === 'Functional Head');
      const tlSchedule = scheduleData.find(s => s.mail_type === 'Assistant Manager');

      if (fhSchedule) {
        const fhUtcDate = new Date(fhSchedule.mail_date);
        const fhLocalDateString = new Date(fhUtcDate.getTime() - (fhUtcDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        setFhDate(fhLocalDateString);
        setScheduleIds(prev => ({ ...prev, fhId: fhSchedule.id }));
      }
      if (tlSchedule) {
        const tlUtcDate = new Date(tlSchedule.mail_date);
        const tlLocalDateString = new Date(tlUtcDate.getTime() - (tlUtcDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        setTlDate(tlLocalDateString);
        setScheduleIds(prev => ({ ...prev, tlId: tlSchedule.id }));
      }
      setIsEditMode(false); // Start in view mode
      setEditScope(null);
    } else {
      setIsEditMode(true); // No data, so start in create/edit mode
      setEditScope('both');
    }
  }, [scheduleCallDetails.data.scheduleCallData]);



  // Open the "which schedule to modify" dialog instead of jumping straight into edit mode
  const handleModifyClick = () => {
    setPendingChoice('');
    setModalAlert('');
    setModalOpen(true);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setPendingChoice('');
    setModalAlert('');
  };

  const handleModalConfirm = () => {
    if (!pendingChoice) {
      setModalAlert('Please select any one review type.');
      return;
    }
    setEditScope(pendingChoice);
    setIsEditMode(true);
    setModalOpen(false);
    setModalAlert('');
  };

  const handleSubmit = () => {
    if (fhDate && tlDate) {
      const scheduleData = [
        {
          type: 'Functional Head',
          date: fhDate
        },
        {
          type: 'Assistant Manager',
          date: tlDate
        }
      ];

      dispatch(setLoading('schedule_calls', 'scheduleCallLoad', true));
      dispatch(addAction('application/json', 'schedule_calls', 'scheduleCallData', 'scheduleCallLoad', scheduleData));
 
      setIsEditMode(false);
      setEditScope(null);
    }
  };

  const handleUpdate = () => {

  const fhEntry = { id: scheduleIds.fhId, type: 'Functional Head', date: fhDate };
  const tlEntry = { id: scheduleIds.tlId, type: 'Assistant Manager', date: tlDate };
  const bothEntry = [fhEntry, tlEntry];

  const scheduleData =
    editScope === 'fh' ? [fhEntry] :
    editScope === 'manager' ? [tlEntry] :
    bothEntry; // 'both'

    dispatch(setLoading('schedule_calls', 'scheduleCallLoad', true));
    dispatch(updateAction('application/json', 'schedule_calls', 'ScheduleCallData', 'scheduleCallLoad', 'update_schedule', scheduleData));

    setIsEditMode(false);
    setEditScope(null);

    /* if (fhDate && tlDate && scheduleIds.fhId && scheduleIds.tlId) {
      
      const scheduleData = [
        {
          id: scheduleIds.fhId,
          type: 'Functional Head',
          date: fhDate
        },
        {
          id: scheduleIds.tlId,
          type: 'Assistant Manager',
          date: tlDate
        }
      ]; */
     /*  dispatch(setLoading('schedule_calls', 'scheduleCallLoad', true));
      dispatch(updateAction('application/json', 'schedule_calls', 'ScheduleCallData', 'scheduleCallLoad', 'update_schedule', scheduleData)); */
     /*  setIsEditMode(false);
      setEditScope(null);
    } */
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    // Split the date string to avoid timezone issues and create a UTC date.
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));

    return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: 'UTC' });
  };

  const today = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Visibility rules while editing: show only the card(s) matching editScope.
  // In view mode (not editing), always show both.
  const showFhCard = !isEditMode || editScope === 'fh' || editScope === 'both';
  const showManagerCard = !isEditMode || editScope === 'manager' || editScope === 'both';

  // The submit/update button should only require the dates that are actually visible/editable
  const canSubmit =
    (editScope === 'fh' ? !!fhDate :
     editScope === 'manager' ? !!tlDate :
     !!fhDate && !!tlDate);

  // When only one card is visible, center it and give it a normal (half-width) size
  // instead of letting flex:1 stretch it across the whole row.
  const singleCardVisible = showFhCard !== showManagerCard; // exactly one is true
  const gridStyle = singleCardVisible
    ? { ...styles.grid, justifyContent: 'center' }
    : styles.grid;
  const singleCardStyle = singleCardVisible
    ? { ...styles.card, flex: '0 1 auto', width: '50%', minWidth: 320, maxWidth: 480 }
    : styles.card;

  return (
    <div style={styles.page}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={scheduleCallDetails.scheduleCallLoad}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Modify Schedule - choose scope modal */}
      <Dialog
        open={modalOpen}
        onClose={handleModalCancel}
        maxWidth="xs"
        fullWidth
        TransitionComponent={SlideTransition}
        transitionDuration={280}
        PaperProps={{
          className: 'review-dialog-paper',
          style: {
            borderRadius: 18,
          },
        }}
      >
        <DialogTitle
          className="blink-title"
          style={{
            textAlign: 'center',
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {'Choose a Review Type'.split('').map((char, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.05}s` }}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#675c83', textAlign: 'center' }}>
            Please select one review option to modify. You can only choose one type at a time.
          </Typography>

          <RadioGroup
            className="review-radio-group"
            value={pendingChoice}
            onChange={(e) => {
              setPendingChoice(e.target.value);
              setModalAlert('');
            }}
          >
            <FormControlLabel value="fh" control={<Radio />} label="Functional Head's" />
            <FormControlLabel value="manager" control={<Radio />} label="Assistant Managers" />
            <FormControlLabel value="both" control={<Radio />} label="Both" />
          </RadioGroup>

          {/* Animated inline alert - replaces browser alert() */}
          <div
            style={{
              maxHeight: modalAlert ? 60 : 0,
              opacity: modalAlert ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.25s ease, margin-top 0.3s ease',
              marginTop: modalAlert ? 12 : 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fdecea',
                color: '#b71c1c',
                border: '1px solid #f5c6cb',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(183, 28, 28, 0.15)',
                animation: modalAlert ? 'shakeAlert 0.4s ease' : 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" stroke="#b71c1c" strokeWidth="1.4" />
                <path d="M8 4.5v4.2" stroke="#b71c1c" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="8" cy="11.2" r="0.9" fill="#b71c1c" />
              </svg>
              {modalAlert}
            </div>
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleModalCancel}>Cancel</Button>
          <Button variant="contained" onClick={handleModalConfirm}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .card {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid #ede7f6;
          border-radius: 20px;
          padding: 36px 32px;
          transition: box-shadow 0.25s ease, transform 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #9575CD, #B39DDB);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .card:hover {
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
          transform: translateY(-3px);
        }
        .card:hover::before {
          opacity: 1;
        }
        .card:focus-within {
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
          transform: translateY(-3px);
        }
        .card:focus-within::before {
          opacity: 1;
        }

        input[type="date"] {
          width: 100%;
          border: 1.5px solid #e0ddef;
          border-radius: 12px;
          padding: 14px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: #4527a0;
          background: #faf9f7;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
        }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: none; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0.5;
          cursor: pointer;
        }
        input[type="date"]:focus {
          border-color: #7E57C2;
          background: #fff;
        }
        input[type="date"]:hover {
          border-color: #9575CD;
          background: #fff;
        }

        .btn {
          background: #5E35B1;
          color: white;
          border: none;
          border-radius: 14px;
          padding: 16px 40px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .btn:hover:not(:disabled) {
          background: #512DA8;
          transform: translateY(-2px);
          color: white;
          box-shadow: 0 8px 24px rgba(94, 53, 177, 0.2);
        }
        .btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn:disabled {
          background: #d1c4e9;
          cursor: not-allowed;
        }
        .btn.success {
          background: #4CAF50;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ede7f6;
          color: #5E35B1;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 100px;
          margin-bottom: 16px;
        }

        .date-preview {
          margin-top: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #5E35B1;
          font-weight: 500;
          min-height: 20px;
          transition: opacity 0.2s;
        }

        @media (max-width: 600px) {
          .grid { flex-direction: column !important; }
        }

        @keyframes shakeAlert {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @keyframes letterBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes radioPop {
          0% { transform: scale(0.85); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        @keyframes modalPopIn {
          0% {
            transform: scale(0.85);
            opacity: 0;
          }
          60% {
            transform: scale(1.03);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .review-dialog-paper {
          animation: modalPopIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
          transition: background-color 0.35s ease, box-shadow 0.35s ease;
          box-shadow: 0 12px 40px rgba(103, 92, 131, 0.35);
        }

        .review-dialog-paper:hover {
          background-color: #f8f6fc;
          box-shadow: 0 16px 50px rgba(103, 92, 131, 0.45);
        }

        .blink-title span {
          display: inline-block;
          animation: letterBlink 1.8s ease-in-out infinite;
        }

        .review-radio-group .MuiFormControlLabel-root {
          margin: 4px 0;
          padding: 8px 12px;
          border-radius: 10px;
          transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
        }

        .review-radio-group .MuiFormControlLabel-root:hover {
          background: #f4f1fb;
          box-shadow: 0 2px 8px rgba(103, 92, 131, 0.15);
        }

        .review-radio-group .Mui-checked {
          animation: radioPop 0.3s ease;
        }

        .review-radio-group .MuiFormControlLabel-root:has(.Mui-checked) {
          background: #ede7f6;
          box-shadow: 0 3px 10px rgba(103, 92, 131, 0.2);
        }
        .review-radio-group .MuiFormControlLabel-label {
          color: #675c83;
          font-weight: 500;
          transition: color 0.25s ease;
        }

        .review-radio-group .MuiFormControlLabel-root:hover .MuiFormControlLabel-label {
          color: #4a3f73;
        }

        .review-radio-group .MuiFormControlLabel-root:has(.Mui-checked) .MuiFormControlLabel-label {
          color: #6c4fbb;
          font-weight: 700;
        }
      `}
      
      </style>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Schedule Review Calls</h1>
          <p style={styles.subtitle}>
            Set the dates for both review sessions below. Invites will be sent once confirmed.
          </p>
          <Button
            onClick={() => window.history.back()}
            startIcon={<ArrowBackIcon />}
            sx={{ marginLeft: '90%',marginTop: '-15%' }}
          >
              Back
          </Button>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Cards */}
        <div className="grid" style={gridStyle}>
          {/* Function Head */}
          {showFhCard && (
            <div className="card" style={singleCardStyle} id="function-head-card">
              <div className="badge">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 3v2l1.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Function Head
              </div>
              <h2 style={styles.cardTitle}>Functional Head's Review</h2>
              <p style={styles.cardDesc}>Group session with the function head to review performance metrics and strategic goals. </p>
              <div style={{ marginTop: 24 }}>
                <label style={styles.label}>Select date</label>
                <input
                  type="date"
                  min={today}
                  value={fhDate}
                  disabled={!isEditMode}
                  onChange={(e) => setFhDate(e.target.value)}
                />
                <div className="date-preview" style={{ opacity: fhDate ? 1 : 0 }}>
                  📅 {formatDate(fhDate)}
                </div>
              </div>
            </div>
          )}

          {/* Assistant Managers */}
          {showManagerCard && (
            <div className="card" style={singleCardStyle} id="assistant-managers-card">
              <div className="badge">
                <svg width="10" height="10" viewBox="0 0 12 10" fill="none">
                  <circle cx="4" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M1 9c0-1.66 1.34-3 3-3M8 6c1.66 0 3 1.34 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Assistant Managers
              </div>
              <h2 style={styles.cardTitle}>Assistant Manager's Review</h2>
              <p style={styles.cardDesc}>Group session with all Assistant Managers to align on deliverables, blockers, and upcoming priorities.</p>
              <div style={{ marginTop: 24 }}>
                <label style={styles.label}>Select date</label>
                <input
                  type="date"
                  min={today}
                  value={tlDate}
                  disabled={!isEditMode}
                  onChange={(e) => setTlDate(e.target.value)}
                />
                <div className="date-preview" style={{ opacity: tlDate ? 1 : 0 }}>
                  📅 {formatDate(tlDate)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={styles.footer}>
          {hasExistingData && !isEditMode ? (
            <button className="btn" onClick={handleModifyClick}>
              Modify Schedule
            </button>
          ) : (
            <button
              className="btn"
              onClick={hasExistingData ? handleUpdate : handleSubmit}
              disabled={!canSubmit || scheduleCallDetails.scheduleCallLoad}
            >
              {scheduleCallDetails.scheduleCallLoad
                ? "Saving..."
                : hasExistingData ? "Update Schedule" : "Confirm Schedule"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    background: "#f8f7fc",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "30px 40px",
    fontFamily: "'DM Sans', sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 1200,
  },
  header: {
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#9575CD",
    marginBottom: 16,
  },
  title: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "clamp(32px, 5vw, 42px)",
    fontWeight: 700,
    lineHeight: 1.1,
    color: "#311B92",
    marginBottom: 16,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: 15,
    color: "#675c83",
    lineHeight: 1.1,
    maxWidth: 600,
    fontWeight: 300,
  },
  divider: {
    height: 1,
    background: "linear-gradient(90deg, #d1c4e9, transparent)",
    marginBottom: 32,
  },
  grid: {
    display: "flex",
    gap: 20,
  },
  card: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: 22,
    fontWeight: 400,
    color: "#4527a0",
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13.5,
    color: "#796c93",
    lineHeight: 1.65,
    fontWeight: 300,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#7E57C2",
    marginBottom: 8,
  },
  footer: {
    marginTop: 36,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  readyText: {
    fontSize: 13,
    color: "#3d7a5e",
    fontWeight: 500,
  },
};

export default ScheduleCalls;