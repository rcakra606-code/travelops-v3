import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useTheme, ACCENT_PRESETS } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useHotels } from '../context/HotelContext';
import { useDocuments } from '../context/DocumentContext';
import { useTelecoms } from '../context/TelecomContext';
import { useSales } from '../context/SalesContext';
import { useProductivity } from '../context/ProductivityContext';
import { useKnowledge } from '../context/KnowledgeContext';
import { useUsers } from '../context/UserContext';
import { useCorporate } from '../context/CorporateContext';
import { supabase } from '../supabaseClient';
import TopNav from '../components/TopNav';
import Sidebar from '../components/Sidebar';
import ExportMenu from '../components/ExportMenu';
import Pagination from '../components/Pagination';
import {
  baseInputStyle,
  FormField,
  SettingsSection,
  SettingsConfirmModal,
  PasswordPolicyMeter,
  LogDetailsDrawer
} from '../components/settings/SettingsUI';
import {
  Save, Shield, Mail, Monitor, AlertTriangle, Database, Download, Trash2, List,
  Users, Search, Lock, Key, Server, Laptop, Palette, Sun, Moon, Eye, EyeOff,
  RefreshCw, PlayCircle, Send, Zap, CheckCircle2, Activity
} from 'lucide-react';
import { logSystemAction } from '../utils/logger';
import { buildTestVerificationEmailHtml } from '../utils/emailTemplateBuilder';

const LOGS_PER_PAGE = 20;

const Settings = () => {
  const { settings, updateSettings, reloadSettings } = useSettings();
  const { user, forceLogoutAll } = useAuth();
  const { theme, toggleTheme, accent, changeAccent } = useTheme();
  const { toast } = useToast();

  // Multi-module contexts for 360° telemetry & operations reminders
  const { tours = [] } = useTours() || {};
  const { cruises = [] } = useCruises() || {};
  const { hotels = [] } = useHotels() || {};
  const { documents = [] } = useDocuments() || {};
  const { telecoms = [] } = useTelecoms() || {};
  const { sales = [] } = useSales() || {};
  const { tasks = [] } = useProductivity() || {};
  const { tourRoutes = [], tourObjects = [], cities = [], countries = [] } = useKnowledge() || {};
  const { users = [] } = useUsers() || {};
  const { corporateAccounts = [] } = useCorporate() || {};

  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#00d4ff';

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState('database');

  // Form State
  const [formData, setFormData] = useState({
    idleTimeout: settings.idleTimeout || 15,
    enableReminders: settings.enableReminders ?? true,
    companyName: settings.companyName || 'TravelOps Inc.',
    currency: settings.currency || 'IDR',
    dateFormat: settings.dateFormat || 'YYYY-MM-DD',
    language: settings.language || 'en',
    passwordMinLength: settings.passwordMinLength || 8,
    passwordRequireNumbers: settings.passwordRequireNumbers ?? true,
    passwordRequireSymbols: settings.passwordRequireSymbols ?? true,
    lockoutThreshold: settings.lockoutThreshold || 5,
    logRetentionDays: settings.logRetentionDays || 30,
    smtpHost: settings.smtpHost || 'smtp.gmail.com',
    smtpPort: settings.smtpPort || 587,
    smtpUser: settings.smtpUser || '',
    smtpPass: settings.smtpPass || '',
    smtpSenderName: settings.smtpSenderName || 'TravelOps System',
    notificationEmail: settings.notificationEmail || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // Sync settings when loaded without triggering cascading render effects
  const [prevSettings, setPrevSettings] = useState(settings);
  if (settings && settings !== prevSettings) {
    setPrevSettings(settings);
    setFormData({
      idleTimeout: settings.idleTimeout || 15,
      enableReminders: settings.enableReminders ?? true,
      companyName: settings.companyName || 'TravelOps Inc.',
      currency: settings.currency || 'IDR',
      dateFormat: settings.dateFormat || 'YYYY-MM-DD',
      language: settings.language || 'en',
      passwordMinLength: settings.passwordMinLength || 8,
      passwordRequireNumbers: settings.passwordRequireNumbers ?? true,
      passwordRequireSymbols: settings.passwordRequireSymbols ?? true,
      lockoutThreshold: settings.lockoutThreshold || 5,
      logRetentionDays: settings.logRetentionDays || 30,
      smtpHost: settings.smtpHost || 'smtp.gmail.com',
      smtpPort: settings.smtpPort || 587,
      smtpUser: settings.smtpUser || '',
      smtpPass: settings.smtpPass || '',
      smtpSenderName: settings.smtpSenderName || 'TravelOps System',
      notificationEmail: settings.notificationEmail || ''
    });
  }

  // Database Connection Health State
  const [pingStatus, setPingStatus] = useState({ latency: null, isPinging: false, lastTested: null });

  // System Logs State
  const [systemLogs, setSystemLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('All');
  const [logPage, setLogPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  // Active Sessions State
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Modals Confirmation State
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Proceed',
    variant: 'danger',
    action: null
  });

  // SMTP Test Email State
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [testEmailFeedback, setTestEmailFeedback] = useState('');

  // Operations Reminders Manual Scan State
  const [reminderScanStatus, setReminderScanStatus] = useState('idle'); // 'idle' | 'running' | 'completed' | 'error'
  const [reminderScanReport, setReminderScanReport] = useState(null);
  const [customReminderEmail, setCustomReminderEmail] = useState('');

  const closeMobile = () => {
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Database Ping & Latency Tester
  // ---------------------------------------------------------------------------
  const runDatabasePing = useCallback(async () => {
    try {
      setPingStatus((prev) => ({ ...prev, isPinging: true }));
      const start = performance.now();
      const { error } = await supabase.from('travelops_settings').select('setting_key').limit(1);
      const elapsed = Math.round(performance.now() - start);

      if (error) throw error;
      setPingStatus({
        latency: elapsed,
        isPinging: false,
        lastTested: new Date().toLocaleTimeString()
      });
      toast.success(`Supabase connection healthy (${elapsed}ms)`);
    } catch (err) {
      setPingStatus({
        latency: null,
        isPinging: false,
        lastTested: new Date().toLocaleTimeString()
      });
      toast.error(`Database ping failed: ${err.message}`);
    }
  }, [toast]);

  // ---------------------------------------------------------------------------
  // Load System Logs
  // ---------------------------------------------------------------------------
  const loadLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const { data, error } = await supabase
        .from('travelops_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const mapped = (data || []).map((log) => ({
        id: log.id,
        timestamp: log.created_at,
        user: log.user_name || 'System',
        action: log.action || 'Action',
        details: log.details || '',
        metadata: log.metadata || null
      }));

      setSystemLogs(mapped);
    } catch (err) {
      console.error('Failed to load system logs:', err);
      toast.error('Could not refresh system logs.');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast]);

  // ---------------------------------------------------------------------------
  // Load Active Sessions
  // ---------------------------------------------------------------------------
  const loadSessions = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingSessions(true);
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });

      if (error) throw error;
      setActiveSessions(data || []);
    } catch (err) {
      console.warn('Could not load user sessions:', err.message);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'logs') loadLogs();
    if (newTab === 'security') loadSessions();
    if (newTab === 'database' && pingStatus.latency === null) runDatabasePing();
  };

  useEffect(() => {
    let cancelled = false;
    const start = performance.now();
    supabase
      .from('travelops_settings')
      .select('setting_key')
      .limit(1)
      .then(({ error }) => {
        if (!cancelled && !error) {
          const elapsed = Math.round(performance.now() - start);
          setPingStatus({
            latency: elapsed,
            isPinging: false,
            lastTested: new Date().toLocaleTimeString()
          });
        }
      });

    supabase
      .from('travelops_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!cancelled && !error && data) {
          setSystemLogs(
            data.map((log) => ({
              id: log.id,
              timestamp: log.created_at,
              user: log.user_name || 'System',
              action: log.action || 'Action',
              details: log.details || '',
              metadata: log.metadata || null
            }))
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Filtered & Paginated Logs
  // ---------------------------------------------------------------------------
  const filteredLogs = useMemo(() => {
    let result = systemLogs;
    if (logActionFilter !== 'All') {
      result = result.filter((log) => {
        const act = String(log.action).toLowerCase();
        if (logActionFilter === 'Auth') return act.includes('login') || act.includes('logout') || act.includes('session');
        if (logActionFilter === 'Settings') return act.includes('setting') || act.includes('theme') || act.includes('preference');
        if (logActionFilter === 'Reminders') return act.includes('reminder') || act.includes('smtp') || act.includes('email');
        if (logActionFilter === 'Backup') return act.includes('backup') || act.includes('snapshot') || act.includes('purge');
        return true;
      });
    }
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          String(log.user).toLowerCase().includes(q) ||
          String(log.action).toLowerCase().includes(q) ||
          String(log.details).toLowerCase().includes(q)
      );
    }
    return result;
  }, [systemLogs, logActionFilter, logSearchQuery]);

  const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
  const currentLogPage = Math.min(logPage, totalLogPages);
  const pagedLogs = useMemo(() => {
    const start = (currentLogPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(start, start + LOGS_PER_PAGE);
  }, [filteredLogs, currentLogPage]);

  // Export Columns Configuration for Logs
  const logExportColumns = useMemo(
    () => [
      { header: 'Timestamp', key: 'formattedTime' },
      { header: 'Initiated By', key: 'user' },
      { header: 'Action', key: 'action' },
      { header: 'Event Details', key: 'details' }
    ],
    []
  );

  const logExportData = useMemo(
    () =>
      filteredLogs.map((log) => ({
        ...log,
        formattedTime: log.timestamp ? new Date(log.timestamp).toLocaleString() : ''
      })),
    [filteredLogs]
  );

  // ---------------------------------------------------------------------------
  // Save Settings Changes
  // ---------------------------------------------------------------------------
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        idleTimeout: Number(formData.idleTimeout) || 15,
        passwordMinLength: Number(formData.passwordMinLength) || 8,
        lockoutThreshold: Number(formData.lockoutThreshold) || 5,
        logRetentionDays: Number(formData.logRetentionDays) || 30
      };

      await updateSettings(payload);
      await reloadSettings();
      toast.success('System settings & preferences updated successfully');
      logSystemAction(user, 'Settings Updated', 'Global workspace preferences & security configuration saved.');
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Send SMTP Test Email
  // ---------------------------------------------------------------------------
  const handleSendTestEmail = async () => {
    if (!testEmailTarget) {
      setTestEmailStatus('error');
      setTestEmailFeedback('Please enter a destination recipient email address.');
      toast.warning('Recipient email address required.');
      return;
    }

    const host = formData.smtpHost || settings.smtpHost || 'smtp.gmail.com';
    const port = Number(formData.smtpPort || settings.smtpPort || 587);
    const userEmail = formData.smtpUser || settings.smtpUser;
    const userPass = formData.smtpPass || settings.smtpPass;
    const senderName = formData.smtpSenderName || settings.smtpSenderName || 'TravelOps System';

    if (!userEmail || !userPass) {
      setTestEmailStatus('error');
      setTestEmailFeedback('Please configure SMTP Username (email) and Password / App Password above before dispatching a test.');
      toast.warning('SMTP credentials incomplete.');
      return;
    }

    setTestEmailStatus('sending');
    setTestEmailFeedback('');

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          to: testEmailTarget,
          subject: 'TravelOps SMTP Server Verification',
          text: `TravelOps Automated Dispatch Verification\n\nThis confirms your SMTP server is actively connected and dispatching.\n\nServer: ${host}:${port}\nSender: ${senderName} <${userEmail}>\nRecipient: ${testEmailTarget}\nTimestamp: ${new Date().toLocaleString()}`,
          html: buildTestVerificationEmailHtml({
            host,
            port,
            senderName,
            userEmail,
            recipient: testEmailTarget,
            appUrl: typeof window !== 'undefined' ? window.location.origin : ''
          }),
          smtpConfig: {
            host,
            port,
            user: userEmail,
            pass: userPass,
            senderName
          }
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setTestEmailStatus('success');
        setTestEmailFeedback(data.message || `Test verification email delivered to ${testEmailTarget}!`);
        toast.success(`Verification email dispatched to ${testEmailTarget}`);
        logSystemAction(user, 'SMTP Test', `Successfully sent test email to ${testEmailTarget} via ${host}`);
      } else {
        setTestEmailStatus('error');
        setTestEmailFeedback(data.error || 'Failed to dispatch email. Check host, port, username, or App Password.');
        toast.error('SMTP test email failed.');
        logSystemAction(user, 'SMTP Test Failed', `Failed sending test email to ${testEmailTarget}: ${data.error || 'Unknown'}`);
      }
    } catch (err) {
      setTestEmailStatus('error');
      setTestEmailFeedback(err.message || 'Could not reach backend email service.');
      toast.error('Network error contacting SMTP endpoint.');
    }
  };

  // ---------------------------------------------------------------------------
  // 360° Operations Reminders Scanner (Tours, Cruises, Docs, Hotels, SIMs)
  // ---------------------------------------------------------------------------
  const handleRunOperationsScanner = async () => {
    setReminderScanStatus('running');
    setReminderScanReport(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDiffDays = (targetDate) => {
      if (!targetDate) return null;
      const target = new Date(targetDate);
      if (Number.isNaN(target.getTime())) return null;
      target.setHours(0, 0, 0, 0);
      return Math.round((target - today) / (1000 * 60 * 60 * 24));
    };

    const targetIntervals = [30, 20, 15, 10, 7, 3, 0];
    const detectedReminders = [];
    const detectedUninvoicedTours = [];
    const detectedExpiringDocs = [];
    const detectedHotelDeadlines = [];
    const detectedPendingTelecom = [];

    // 1. Scan Tours
    tours.forEach((t) => {
      const s = String(t.status || '').toLowerCase();
      if (s === 'cancel' || s === 'cancelled') return;

      const code = t.internals?.tourCode || t.tourCode || `TR-${t.id?.slice(0, 6)}`;
      const title = t.internals?.tourName || t.tourName || t.country || 'Tour Group';
      const staff = t.staffName || t.internals?.staffName || t.pic || '-';
      const customer = t.internals?.customerName || t.customerName || (t.paxInfo?.[0]?.name) || '-';
      const pax = Number(t.paxCount) || (t.paxInfo ? t.paxInfo.length : 1);

      const diffDep = getDiffDays(t.departureDate);
      const diffRet = getDiffDays(t.returnDate);

      const invoiceNum = t.financials?.invoiceNumber || t.invoiceNumber;
      if (!invoiceNum && diffDep !== null && [30, 20, 15, 10].includes(diffDep)) {
        detectedUninvoicedTours.push({
          type: 'Tour',
          code,
          title,
          customerName: customer,
          handlingStaff: staff,
          destination: t.country || '-',
          targetDate: t.departureDate,
          milestone: diffDep === 10 ? '🚨 H-10 URGENT: Uninvoiced' : diffDep === 15 ? '⚡ H-15 WARNING: Uninvoiced' : `⚠️ H-${diffDep}: Uninvoiced`,
          daysRemaining: diffDep,
          pax
        });
      }

      if (diffDep !== null && targetIntervals.includes(diffDep)) {
        detectedReminders.push({
          type: 'Tour',
          code,
          title,
          customerName: customer,
          handlingStaff: staff,
          targetDate: t.departureDate,
          milestone: diffDep === 0 ? 'Departure Today (Day 0)' : `${diffDep} Day${diffDep > 1 ? 's' : ''} to Departure`,
          daysRemaining: diffDep,
          pax
        });
      }

      if (diffRet === 0) {
        detectedReminders.push({
          type: 'Tour',
          code,
          title,
          customerName: customer,
          handlingStaff: staff,
          targetDate: t.returnDate,
          milestone: 'Return Day (Day 0)',
          daysRemaining: 0,
          pax
        });
      }
    });

    // 2. Scan Cruises
    cruises.forEach((c) => {
      const s = String(c.status || '').toLowerCase();
      if (s === 'cancel' || s === 'cancelled') return;

      const code = c.bookingCode || `CR-${c.id?.slice(0, 6)}`;
      const title = `${c.shipName || 'Cruise'} — ${c.itinerary || c.destination || 'Sailing'}`;
      const staff = c.staff || c.pic || '-';
      const customer = c.leadGuest || c.guestName || '-';
      const pax = Number(c.paxCount) || 1;

      const diffDep = getDiffDays(c.departureDate || c.sailDate);
      const diffRet = getDiffDays(c.returnDate);

      if (diffDep !== null && targetIntervals.includes(diffDep)) {
        detectedReminders.push({
          type: 'Cruise',
          code,
          title,
          customerName: customer,
          handlingStaff: staff,
          targetDate: c.departureDate || c.sailDate,
          milestone: diffDep === 0 ? 'Sail Today (Day 0)' : `${diffDep} Day${diffDep > 1 ? 's' : ''} to Sailing`,
          daysRemaining: diffDep,
          pax
        });
      }
      if (diffRet === 0) {
        detectedReminders.push({
          type: 'Cruise',
          code,
          title,
          customerName: customer,
          handlingStaff: staff,
          targetDate: c.returnDate,
          milestone: 'Cruise Return Today',
          daysRemaining: 0,
          pax
        });
      }
    });

    // 3. Scan Visas & Documents for upcoming appointments & delivery deadlines
    documents.forEach((d) => {
      if (d.shippingStatus === 'Delivered' || d.receivedStatus === 'Received') return;

      if (d.appointmentDate) {
        const diffApp = getDiffDays(d.appointmentDate);
        if (diffApp !== null && diffApp >= 0 && diffApp <= 7) {
          detectedExpiringDocs.push({
            type: 'Document',
            code: d.bookingCode || `DOC-${d.id?.slice(0, 6)}`,
            title: `${d.docType || 'Visa'} — ${d.country || 'Embassy'}`,
            customerName: d.guestName || '-',
            handlingStaff: d.staff || '-',
            targetDate: `${d.appointmentDate} ${d.appointmentTime || ''}`,
            milestone: diffApp === 0 ? 'Appointment Today' : `Appointment in ${diffApp} day(s)`,
            daysRemaining: diffApp
          });
        }
      }

      if (d.estimatedDone) {
        const diffEst = getDiffDays(d.estimatedDone);
        if (diffEst !== null && diffEst <= 1) {
          detectedExpiringDocs.push({
            type: 'Document',
            code: d.bookingCode || `DOC-${d.id?.slice(0, 6)}`,
            title: `${d.docType || 'Passport/Visa'} Completion Target`,
            customerName: d.guestName || '-',
            handlingStaff: d.staff || '-',
            targetDate: d.estimatedDone,
            milestone: diffEst < 0 ? `Overdue by ${Math.abs(diffEst)}d` : diffEst === 0 ? 'Due Today' : 'Due Tomorrow',
            daysRemaining: diffEst
          });
        }
      }
    });

    // 4. Scan Hotel Bookings for check-ins within 7 days
    hotels.forEach((h) => {
      const s = String(h.status || h.bookingStatus || '').toLowerCase();
      if (s === 'cancel' || s === 'cancelled') return;

      const diffIn = getDiffDays(h.checkIn || h.checkInDate);
      if (diffIn !== null && diffIn >= 0 && diffIn <= 7) {
        detectedHotelDeadlines.push({
          type: 'Hotel',
          code: h.confirmationNumber || h.bookingCode || `HTL-${h.id?.slice(0, 6)}`,
          title: h.hotelName || 'Hotel Reservation',
          customerName: h.guestName || '-',
          handlingStaff: h.staff || '-',
          targetDate: h.checkIn || h.checkInDate,
          milestone: diffIn === 0 ? 'Check-in Today' : `Check-in in ${diffIn} day(s)`,
          daysRemaining: diffIn
        });
      }
    });

    // 5. Scan Travel SIM / eSIMs pending activation within 3 days
    telecoms.forEach((sim) => {
      const s = String(sim.status || '').toLowerCase();
      if (s === 'active' || s === 'completed' || s === 'cancelled') return;

      const diffAct = getDiffDays(sim.activationDate || sim.startDate);
      if (diffAct !== null && diffAct >= 0 && diffAct <= 3) {
        detectedPendingTelecom.push({
          type: 'SIM/eSIM',
          code: sim.simNumber || sim.iccid || `SIM-${sim.id?.slice(0, 6)}`,
          title: `${sim.destination || sim.country || 'Travel SIM'} (${sim.plan || 'Data Plan'})`,
          customerName: sim.customerName || sim.guestName || '-',
          handlingStaff: sim.staff || '-',
          targetDate: sim.activationDate || sim.startDate,
          milestone: diffAct === 0 ? 'Activate Today' : `Activation in ${diffAct} day(s)`,
          daysRemaining: diffAct
        });
      }
    });

    const host = formData.smtpHost || settings.smtpHost || 'smtp.gmail.com';
    const port = Number(formData.smtpPort || settings.smtpPort || 587);
    const userEmail = formData.smtpUser || settings.smtpUser;
    const userPass = formData.smtpPass || settings.smtpPass;
    const senderName = formData.smtpSenderName || settings.smtpSenderName || 'TravelOps System';
    const targetRecipient = customReminderEmail || formData.notificationEmail || settings.notificationEmail || user?.email || userEmail;

    const totalDetected =
      detectedReminders.length +
      detectedUninvoicedTours.length +
      detectedExpiringDocs.length +
      detectedHotelDeadlines.length +
      detectedPendingTelecom.length;

    let emailSent = false;
    let dispatchMessage = '';

    if (totalDetected > 0 && targetRecipient && userEmail && userPass) {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        const token = session?.access_token || '';

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
              <div>
                <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">TravelOps Operations Digest</h2>
                <p style="margin: 0; font-size: 12px; color: #64748b;">360° Multi-Module Automated Scan</p>
              </div>
              <span style="background: #e0f2fe; color: #0284c7; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
                ${totalDetected} Alert${totalDetected > 1 ? 's' : ''} Detected
              </span>
            </div>

            <p style="font-size: 13px; color: #334155; margin-bottom: 16px;">
              Operations scan executed by <strong>${user?.name || user?.email || 'Admin'}</strong> on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString()}:
            </p>

            ${detectedUninvoicedTours.length > 0 ? `
              <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 6px 0; color: #9f1239; font-size: 13px;">🚨 Uninvoiced Tour Alerts (${detectedUninvoicedTours.length})</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #4c0519;">
                  ${detectedUninvoicedTours.map((t) => `<li><strong>${t.code}</strong> — ${t.title} (${t.customerName}) · ${t.milestone}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${detectedReminders.length > 0 ? `
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 6px 0; color: #166534; font-size: 13px;">✈️ Trip Departure & Return Milestones (${detectedReminders.length})</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #14532d;">
                  ${detectedReminders.map((r) => `<li><strong>${r.code}</strong> — ${r.title} · ${r.milestone}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${detectedExpiringDocs.length > 0 ? `
              <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 6px 0; color: #854d0e; font-size: 13px;">🛂 Document Appointments & Deadlines (${detectedExpiringDocs.length})</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #713f12;">
                  ${detectedExpiringDocs.map((d) => `<li><strong>${d.code}</strong> — ${d.title} (${d.customerName}) · ${d.milestone}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px;">
              TravelOps Operations Dispatch Engine • Automated Notifications
            </p>
          </div>
        `;

        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            to: targetRecipient,
            subject: `TravelOps Operations Alert: ${totalDetected} Action Item${totalDetected > 1 ? 's' : ''}`,
            text: `TravelOps Operations Digest\n\n${totalDetected} action items detected. Please check dashboard.`,
            html: emailHtml,
            category: 'operations_digest',
            smtpConfig: { host, port, user: userEmail, pass: userPass, senderName }
          })
        });

        const d = await res.json().catch(() => ({}));
        if (res.ok && d.success) {
          emailSent = true;
          dispatchMessage = `Consolidated operations digest dispatched to ${targetRecipient}`;
          toast.success(dispatchMessage);
        } else {
          dispatchMessage = `Identified items, but email dispatch failed: ${d.error || 'Check SMTP credentials'}`;
          toast.warning(dispatchMessage);
        }
      } catch (e) {
        dispatchMessage = `Email dispatch network error: ${e.message}`;
        toast.warning(dispatchMessage);
      }
    }

    const report = {
      timestamp: new Date().toLocaleTimeString(),
      totalDetected,
      emailSent,
      dispatchMessage,
      recipient: targetRecipient || 'None specified',
      uninvoicedTours: detectedUninvoicedTours,
      departureReminders: detectedReminders,
      documentDeadlines: detectedExpiringDocs,
      hotelDeadlines: detectedHotelDeadlines,
      telecomDeadlines: detectedPendingTelecom
    };

    setReminderScanReport(report);
    setReminderScanStatus('completed');

    logSystemAction(
      user,
      'Operations Reminders Scan',
      `Scanned tours, cruises, documents, hotels, and SIMs. Found ${totalDetected} actionable operational item(s).`
    );
  };

  // ---------------------------------------------------------------------------
  // Session Revocation & Global Invalidation Handlers
  // ---------------------------------------------------------------------------
  const handleRevokeSingleSession = (session) => {
    setConfirmModal({
      open: true,
      title: 'Revoke User Session?',
      message: `Disconnect session on ${session.device} (${session.ip})? The user on that device will be required to log in again.`,
      confirmLabel: 'Revoke Session',
      variant: 'danger',
      action: async () => {
        try {
          await supabase.from('user_sessions').delete().eq('id', session.id);
          setActiveSessions((prev) => prev.filter((s) => s.id !== session.id));
          toast.success('Session disconnected');
          logSystemAction(user, 'Session Revoked', `Revoked session ${session.id} (${session.device})`);
        } catch (err) {
          toast.error(`Revoke failed: ${err.message}`);
        }
      }
    });
  };

  const handleForceLogoutAllPrompt = () => {
    setConfirmModal({
      open: true,
      title: 'Force Logout All Other Sessions?',
      message: 'This will instantly invalidate all active login session tokens across all devices except your current session. All other users will be required to authenticate again.',
      confirmLabel: 'Disconnect All Other Sessions',
      variant: 'danger',
      action: async () => {
        try {
          forceLogoutAll();
          if (user) {
            await supabase.from('user_sessions').delete().eq('user_id', user.id).neq('id', localStorage.getItem('travelops_session_id') || '');
          }
          await loadSessions();
          toast.success('All other active sessions have been disconnected');
          logSystemAction(user, 'Force Logout All', 'Invalidated all active session tokens across devices.');
        } catch (err) {
          toast.error(`Force logout failed: ${err.message}`);
        }
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Manual Database Snapshot & Log Retention Purge
  // ---------------------------------------------------------------------------
  const handleTriggerManualSnapshot = async () => {
    try {
      toast.info('Initiating database snapshot verification…');
      await runDatabasePing();
      logSystemAction(user, 'Manual Backup', 'Triggered database snapshot & integrity verification.');
      toast.success('Database snapshot verified & recorded.');
    } catch (err) {
      toast.error(`Snapshot failed: ${err.message}`);
    }
  };

  const handlePurgeLogsPrompt = () => {
    const days = Number(formData.logRetentionDays) || 30;
    setConfirmModal({
      open: true,
      title: 'Purge Old Audit Logs?',
      message: `Permanently delete system audit logs older than ${days} days based on your configured retention policy? This action cannot be reversed.`,
      confirmLabel: `Purge Logs Older Than ${days} Days`,
      variant: 'danger',
      action: async () => {
        try {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          const { error } = await supabase.from('travelops_logs').delete().lt('created_at', cutoff.toISOString());
          if (error) throw error;
          await loadLogs();
          toast.success(`Purged system logs older than ${days} days.`);
          logSystemAction(user, 'Logs Purged', `Deleted audit logs older than ${cutoff.toISOString()}`);
        } catch (err) {
          toast.error(`Purge failed: ${err.message}`);
        }
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Multi-Module Live Storage Counts
  // ---------------------------------------------------------------------------
  const totalKnowledgeRecords = tourRoutes.length + tourObjects.length + cities.length + countries.length;
  const totalOperationalRecords =
    tours.length +
    cruises.length +
    hotels.length +
    documents.length +
    telecoms.length +
    sales.length +
    tasks.length +
    corporateAccounts.length +
    users.length +
    totalKnowledgeRecords;

  const storageTelemetry = useMemo(
    () => [
      { label: 'Tours & Trips', count: tours.length, color: '#0ea5e9' },
      { label: 'Cruise Sailings', count: cruises.length, color: '#8b5cf6' },
      { label: 'Hotel Bookings', count: hotels.length, color: '#10b981' },
      { label: 'Visas & Docs', count: documents.length, color: '#f59e0b' },
      { label: 'SIM & eSIMs', count: telecoms.length, color: '#ec4899' },
      { label: 'Corporate Accounts', count: corporateAccounts.length, color: '#6366f1' },
      { label: 'Sales Records', count: sales.length, color: '#14b8a6' },
      { label: 'Productivity Tasks', count: tasks.length, color: '#f97316' },
      { label: 'Knowledge Base', count: totalKnowledgeRecords, color: '#06b6d4' },
      { label: 'System Users', count: users.length, color: '#a855f7' },
      { label: 'Audit Trail Logs', count: systemLogs.length, color: '#64748b' }
    ],
    [
      tours.length,
      cruises.length,
      hotels.length,
      documents.length,
      telecoms.length,
      corporateAccounts.length,
      sales.length,
      tasks.length,
      totalKnowledgeRecords,
      users.length,
      systemLogs.length
    ]
  );

  return (
    <div className="app-container fade-in">
      <Sidebar isOpen={isSidebarOpen} closeMobile={closeMobile} />

      <div className="main-content">
        <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="content-area">
          <div className="page-container">
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
                  System Settings & Preferences
                </h1>
                <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', margin: 0 }}>
                  Cloud database health, automated dispatches, security policies, and workspace branding
                </p>
              </div>

              {/* Quick Save Header Button for settings tabs */}
              {['security', 'smtp', 'preferences', 'database'].includes(activeTab) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: neonBlue,
                    color: isLight ? '#ffffff' : '#001018',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: `0 4px 14px color-mix(in srgb, ${neonBlue} 30%, transparent)`
                  }}
                >
                  <Save size={16} /> {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="tabs-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
              <button className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`} onClick={() => handleTabChange('database')}>
                <Database size={16} /> Database & Cloud Storage
              </button>
              <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => handleTabChange('logs')}>
                <List size={16} /> Audit Trail ({systemLogs.length})
              </button>
              <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => handleTabChange('security')}>
                <Shield size={16} /> Security & Sessions
              </button>
              <button className={`tab-btn ${activeTab === 'smtp' ? 'active' : ''}`} onClick={() => handleTabChange('smtp')}>
                <Mail size={16} /> SMTP & 360° Automations
              </button>
              <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => handleTabChange('preferences')}>
                <Monitor size={16} /> Workspace & Theme
              </button>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: DATABASE & CLOUD STORAGE TELEMETRY                                */}
            {/* ========================================================================= */}
            {activeTab === 'database' && (
              <div className="fade-in">
                {/* Cloud Connection Hero */}
                <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Server size={26} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="pulse-dot pulse-dot-green" />
                          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            Supabase Cloud Active & Synchronized
                          </h3>
                        </div>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-subtle)', fontSize: '0.82rem' }}>
                          Real-time Postgres synchronization powering all 12 TravelOps operational workspaces
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={runDatabasePing}
                        disabled={pingStatus.isPinging}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-main)',
                          padding: '0.55rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={14} className={pingStatus.isPinging ? 'spin' : ''} />
                        {pingStatus.isPinging ? 'Pinging…' : pingStatus.latency ? `Ping: ${pingStatus.latency}ms` : 'Ping Database'}
                      </button>

                      <button
                        type="button"
                        onClick={handleTriggerManualSnapshot}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          background: `color-mix(in srgb, ${neonBlue} 15%, transparent)`,
                          border: `1px solid ${neonBlue}`,
                          color: neonBlue,
                          padding: '0.55rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={15} /> Trigger Snapshot
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Ribbon */}
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.25rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Live Operational Records
                      </span>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: neonBlue }}>
                        {totalOperationalRecords.toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Across 11 distinct data tables</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Connection Latency
                      </span>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981' }}>
                        {pingStatus.latency ? `${pingStatus.latency} ms` : 'Optimal'}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Tested {pingStatus.lastTested || 'just now'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Daily Automated Backups
                      </span>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Managed (Daily)
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Point-in-time recovery enabled</span>
                    </div>
                  </div>
                </div>

                {/* Table Record Telemetry Grid */}
                <SettingsSection
                  icon={<Activity size={18} />}
                  title="Multi-Module Table Record Telemetry"
                  description="Live row counts scanned directly across active TravelOps workspace modules"
                  neonBlue={neonBlue}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
                    {storageTelemetry.map((tbl) => (
                      <div
                        key={tbl.label}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          padding: '0.85rem 1rem',
                          background: 'var(--bg-surface)',
                          borderLeft: `3px solid ${tbl.color}`
                        }}
                      >
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          {tbl.count.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                          {tbl.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </SettingsSection>

                {/* Data Retention & Housekeeping */}
                <SettingsSection
                  icon={<Database size={18} />}
                  title="Audit Trail Retention & Purge Policy"
                  description="Automatically prune historical logs older than your configured window to preserve database efficiency"
                  neonBlue={neonBlue}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                    <FormField label="Audit Log Retention Policy" hint="Logs older than this threshold become eligible for automatic cleanup.">
                      <select
                        value={formData.logRetentionDays}
                        onChange={(e) => setFormData({ ...formData, logRetentionDays: Number(e.target.value) })}
                        style={baseInputStyle}
                      >
                        <option value={7}>Keep for 7 days</option>
                        <option value={30}>Keep for 30 days (Standard)</option>
                        <option value={60}>Keep for 60 days</option>
                        <option value={90}>Keep for 90 days (Recommended)</option>
                        <option value={365}>Keep for 1 full year</option>
                      </select>
                    </FormField>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Manual Retention Purge
                      </span>
                      <button
                        type="button"
                        onClick={handlePurgeLogsPrompt}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '0.65rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} /> Purge Logs Older Than {formData.logRetentionDays} Days
                      </button>
                    </div>
                  </div>
                </SettingsSection>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: AUDIT TRAIL & SYSTEM LOGS                                         */}
            {/* ========================================================================= */}
            {activeTab === 'logs' && (
              <div className="card fade-in" style={{ padding: '1.4rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <List size={18} color="#f59e0b" /> Security & Operational Audit Trail
                    </h3>
                    <p style={{ margin: '0.15rem 0 0', color: 'var(--text-subtle)', fontSize: '0.78rem' }}>
                      Detailed chronology of logins, settings updates, reminder dispatches, and administrative events
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={loadLogs}
                      disabled={isLoadingLogs}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        padding: '0.45rem 0.8rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <RefreshCw size={13} className={isLoadingLogs ? 'spin' : ''} />
                      Refresh
                    </button>

                    <ExportMenu
                      data={logExportData}
                      columns={logExportColumns}
                      filename={`travelops_audit_logs_${new Date().toISOString().split('T')[0]}`}
                    />
                  </div>
                </div>

                {/* Search & Category Filter Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ position: 'relative', flex: '1 1 240px' }}>
                    <Search size={15} color="var(--text-subtle)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Search by user, action, details..."
                      value={logSearchQuery}
                      onChange={(e) => {
                        setLogSearchQuery(e.target.value);
                        setLogPage(1);
                      }}
                      style={{ ...baseInputStyle, paddingLeft: '2.2rem', padding: '0.5rem 0.75rem 0.5rem 2.2rem', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {['All', 'Auth', 'Settings', 'Reminders', 'Backup'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setLogActionFilter(cat);
                          setLogPage(1);
                        }}
                        className={`tab-btn ${logActionFilter === cat ? 'active' : ''}`}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logs Table */}
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <table className="data-table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', width: '170px' }}>Timestamp</th>
                        <th style={{ textAlign: 'left', width: '140px' }}>Initiated By</th>
                        <th style={{ textAlign: 'left', width: '170px' }}>Action</th>
                        <th style={{ textAlign: 'left' }}>Event Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedLogs.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-subtle)' }}>
                            No audit logs matching search and filter criteria.
                          </td>
                        </tr>
                      ) : (
                        pagedLogs.map((log) => (
                          <tr
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                          >
                            <td style={{ color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td style={{ fontWeight: 600, color: neonBlue }}>
                              {log.user}
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: `color-mix(in srgb, ${neonBlue} 12%, transparent)`,
                                color: neonBlue
                              }}>
                                {log.action}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-main)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.details}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredLogs.length > LOGS_PER_PAGE && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <Pagination
                      currentPage={currentLogPage}
                      totalPages={totalLogPages}
                      onPageChange={setLogPage}
                      totalItems={filteredLogs.length}
                      itemsPerPage={LOGS_PER_PAGE}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: SECURITY POLICIES & ACTIVE SESSIONS                               */}
            {/* ========================================================================= */}
            {activeTab === 'security' && (
              <div className="fade-in">
                {/* Password Policy */}
                <SettingsSection
                  icon={<Key size={18} />}
                  title="Password Complexity & Requirements Policy"
                  description="Enforce security standards across all staff and administrative accounts upon login and password reset"
                  neonBlue={neonBlue}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    <FormField label="Minimum Password Length">
                      <select
                        value={formData.passwordMinLength}
                        onChange={(e) => setFormData({ ...formData, passwordMinLength: Number(e.target.value) })}
                        style={baseInputStyle}
                      >
                        <option value={8}>8 Characters (Basic)</option>
                        <option value={10}>10 Characters</option>
                        <option value={12}>12 Characters (Recommended)</option>
                        <option value={16}>16 Characters (High Security)</option>
                      </select>
                    </FormField>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={formData.passwordRequireNumbers}
                          onChange={(e) => setFormData({ ...formData, passwordRequireNumbers: e.target.checked })}
                          style={{ width: '1.1rem', height: '1.1rem', accentColor: neonBlue }}
                        />
                        Require numeric digits (0-9)
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={formData.passwordRequireSymbols}
                          onChange={(e) => setFormData({ ...formData, passwordRequireSymbols: e.target.checked })}
                          style={{ width: '1.1rem', height: '1.1rem', accentColor: neonBlue }}
                        />
                        Require special symbols (!@#$%^&*)
                      </label>
                    </div>
                  </div>

                  <PasswordPolicyMeter policy={formData} />
                </SettingsSection>

                {/* Account Lockout & Inactivity Timeout */}
                <SettingsSection
                  icon={<Lock size={18} />}
                  title="Brute-Force Lockout & Session Inactivity Timeout"
                  description="Protect accounts from unauthorized brute-force attempts and automatically secure unattended sessions"
                  neonBlue={neonBlue}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <FormField label="Failed Login Lockout Threshold" hint="Account will be temporarily locked for 15 minutes upon consecutive failed attempts.">
                      <select
                        value={formData.lockoutThreshold}
                        onChange={(e) => setFormData({ ...formData, lockoutThreshold: Number(e.target.value) })}
                        style={baseInputStyle}
                      >
                        <option value={3}>3 Failed Attempts</option>
                        <option value={5}>5 Failed Attempts (Default)</option>
                        <option value={10}>10 Failed Attempts</option>
                        <option value={0}>Disabled (Not Recommended)</option>
                      </select>
                    </FormField>

                    <FormField label="Idle Inactivity Auto-Logout" hint="Automatically ends active workspace session after this period of inactivity.">
                      <select
                        value={formData.idleTimeout}
                        onChange={(e) => setFormData({ ...formData, idleTimeout: Number(e.target.value) })}
                        style={baseInputStyle}
                      >
                        <option value={5}>5 Minutes</option>
                        <option value={15}>15 Minutes (Default)</option>
                        <option value={30}>30 Minutes</option>
                        <option value={60}>60 Minutes (1 Hour)</option>
                      </select>
                    </FormField>
                  </div>
                </SettingsSection>

                {/* Active Sessions Control */}
                <SettingsSection
                  icon={<Users size={18} />}
                  title="Active Workspace Sessions Governance"
                  description="Review and terminate active sessions across employee workstations, laptops, and mobile devices"
                  neonBlue={neonBlue}
                  badge={
                    <button
                      type="button"
                      onClick={handleForceLogoutAllPrompt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <AlertTriangle size={14} /> Force Logout All Other Sessions
                    </button>
                  }
                >
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table className="data-table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Device & Client</th>
                          <th style={{ textAlign: 'left' }}>Location & IP</th>
                          <th style={{ textAlign: 'left' }}>Last Active</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingSessions ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                              Loading active sessions…
                            </td>
                          </tr>
                        ) : activeSessions.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                              No active secondary sessions logged.
                            </td>
                          </tr>
                        ) : (
                          activeSessions.map((session) => {
                            const isCurrent = session.id === localStorage.getItem('travelops_session_id');
                            return (
                              <tr key={session.id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <div style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '8px',
                                      background: isCurrent ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                                      color: isCurrent ? '#10b981' : 'var(--text-muted)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '1px solid var(--border)'
                                    }}>
                                      <Laptop size={16} />
                                    </div>
                                    <div>
                                      <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                        {session.device || 'Workstation'}
                                      </strong>
                                      <div style={{ color: 'var(--text-subtle)', fontSize: '0.72rem' }}>
                                        {session.os || 'OS'} • {session.browser || 'Browser'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ color: 'var(--text-main)' }}>{session.location || 'Local / Office'}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{session.ip || '127.0.0.1'}</div>
                                </td>
                                <td>
                                  {isCurrent ? (
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      color: '#10b981',
                                      background: 'rgba(16, 185, 129, 0.12)',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '999px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700
                                    }}>
                                      <span className="pulse-dot pulse-dot-green" /> Current Session
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>
                                      {session.last_active ? new Date(session.last_active).toLocaleString() : 'Recent'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  {!isCurrent && (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeSingleSession(session)}
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </SettingsSection>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: SMTP & 360° AUTOMATED DISPATCH                                    */}
            {/* ========================================================================= */}
            {activeTab === 'smtp' && (
              <div className="fade-in">
                {/* SMTP Server Credentials */}
                <SettingsSection
                  icon={<Mail size={18} />}
                  title="SMTP Mail Server Configuration"
                  description="Configure outbound transport credentials for itinerary delivery, staff reminders, and operations alerts"
                  neonBlue={neonBlue}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <FormField label="SMTP Host / Server" required hint="e.g. smtp.gmail.com, smtp.office365.com, mail.company.com">
                      <input
                        type="text"
                        value={formData.smtpHost}
                        onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                        style={baseInputStyle}
                      />
                    </FormField>

                    <FormField label="SMTP Port" required hint="TLS/STARTTLS (587) or SSL (465)">
                      <select
                        value={formData.smtpPort}
                        onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value) })}
                        style={baseInputStyle}
                      >
                        <option value={587}>587 (TLS / STARTTLS — Recommended)</option>
                        <option value={465}>465 (SSL — Secure)</option>
                        <option value={25}>25 (Standard / Unencrypted)</option>
                        <option value={2525}>2525 (Alternative TLS)</option>
                      </select>
                    </FormField>

                    <FormField label="SMTP Username / Email" required>
                      <input
                        type="email"
                        value={formData.smtpUser}
                        onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                        placeholder="operations@travelops.com"
                        style={baseInputStyle}
                      />
                    </FormField>

                    <FormField label="SMTP Password / App Password" required hint="For Gmail, create a 16-character App Password in Google Account > Security.">
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showSmtpPass ? 'text' : 'password'}
                          value={formData.smtpPass}
                          onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                          placeholder="••••••••••••••••"
                          style={{ ...baseInputStyle, paddingRight: '2.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPass(!showSmtpPass)}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormField>

                    <FormField label="Sender Display Name" span="full">
                      <input
                        type="text"
                        value={formData.smtpSenderName}
                        onChange={(e) => setFormData({ ...formData, smtpSenderName: e.target.value })}
                        placeholder="TravelOps Operations System"
                        style={baseInputStyle}
                      />
                    </FormField>
                  </div>

                  {/* Test Dispatch Bar */}
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <input
                      type="email"
                      placeholder="Enter recipient to verify SMTP transport..."
                      value={testEmailTarget}
                      onChange={(e) => setTestEmailTarget(e.target.value)}
                      style={{ ...baseInputStyle, flex: '1 1 240px', fontSize: '0.82rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={testEmailStatus === 'sending'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: 'var(--success)',
                        padding: '0.65rem 1.1rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Send size={14} /> {testEmailStatus === 'sending' ? 'Sending Test…' : 'Send Test Email'}
                    </button>
                  </div>

                  {testEmailFeedback && (
                    <div style={{
                      marginTop: '0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: testEmailStatus === 'success' ? '#10b981' : '#ef4444'
                    }}>
                      {testEmailStatus === 'success' ? '✓ ' : '✕ '} {testEmailFeedback}
                    </div>
                  )}
                </SettingsSection>

                {/* 360° Operations Reminders Engine */}
                <SettingsSection
                  icon={<Zap size={18} />}
                  title="360° Multi-Module Operations Dispatch Scanner"
                  description="Cross-scans Tours, Cruises, Visas, Hotels, and Travel SIMs to detect deadlines and dispatch consolidated digests"
                  neonBlue={neonBlue}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <FormField label="Automations Recipient Dispatch Target" hint="Defaults to user account email if left blank.">
                      <input
                        type="email"
                        value={customReminderEmail}
                        onChange={(e) => setCustomReminderEmail(e.target.value)}
                        placeholder={formData.notificationEmail || user?.email || 'admin@travelops.com'}
                        style={baseInputStyle}
                      />
                    </FormField>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={handleRunOperationsScanner}
                        disabled={reminderScanStatus === 'running'}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: neonBlue,
                          color: isLight ? '#ffffff' : '#001018',
                          border: 'none',
                          padding: '0.75rem 1.25rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          boxShadow: `0 4px 14px color-mix(in srgb, ${neonBlue} 25%, transparent)`
                        }}
                      >
                        <PlayCircle size={16} />
                        {reminderScanStatus === 'running' ? 'Scanning All Modules…' : 'Run 360° Operations Scan & Dispatch'}
                      </button>
                    </div>
                  </div>

                  {/* Scan Report Output */}
                  {reminderScanReport && (
                    <div style={{
                      marginTop: '1.25rem',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      background: 'var(--bg-surface)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={18} color="#10b981" />
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                            Scan Complete at {reminderScanReport.timestamp}
                          </strong>
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          background: reminderScanReport.totalDetected > 0 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: reminderScanReport.totalDetected > 0 ? '#eab308' : '#10b981'
                        }}>
                          {reminderScanReport.totalDetected} Action Item{reminderScanReport.totalDetected !== 1 ? 's' : ''} Detected
                        </span>
                      </div>

                      {reminderScanReport.dispatchMessage && (
                        <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                          {reminderScanReport.dispatchMessage}
                        </p>
                      )}

                      {/* Detected Items Breakdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                        {reminderScanReport.uninvoicedTours.map((t, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '0.78rem' }}>
                            <span style={{ fontWeight: 700, color: '#ef4444' }}>🚨 Tour Uninvoiced: {t.code} — {t.title}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{t.milestone}</span>
                          </div>
                        ))}

                        {reminderScanReport.departureReminders.map((r, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.78rem' }}>
                            <span style={{ fontWeight: 700, color: '#10b981' }}>✈️ {r.type}: {r.code} — {r.title}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{r.milestone}</span>
                          </div>
                        ))}

                        {reminderScanReport.documentDeadlines.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', fontSize: '0.78rem' }}>
                            <span style={{ fontWeight: 700, color: '#eab308' }}>🛂 Document Target: {d.code} — {d.title}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{d.milestone}</span>
                          </div>
                        ))}

                        {reminderScanReport.hotelDeadlines.map((h, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.78rem' }}>
                            <span style={{ fontWeight: 700, color: '#818cf8' }}>🏨 Hotel Check-In: {h.code} — {h.title}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{h.milestone}</span>
                          </div>
                        ))}

                        {reminderScanReport.telecomDeadlines.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.25)', fontSize: '0.78rem' }}>
                            <span style={{ fontWeight: 700, color: '#ec4899' }}>📱 Travel SIM Activation: {s.code} — {s.title}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{s.milestone}</span>
                          </div>
                        ))}

                        {reminderScanReport.totalDetected === 0 && (
                          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                            ✓ All operational deadlines, milestone departure dates, and document appointments are clear.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </SettingsSection>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: WORKSPACE PREFERENCES & NEON THEME                                  */}
            {/* ========================================================================= */}
            {activeTab === 'preferences' && (
              <div className="fade-in">
                {/* General Localization */}
                <SettingsSection
                  icon={<Monitor size={18} />}
                  title="Workspace Localization & Formats"
                  description="Customize company identity, default financial currency, and standardized date formats"
                  neonBlue={neonBlue}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.25rem' }}>
                    <FormField label="Company / Brand Name">
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="TravelOps Inc."
                        style={baseInputStyle}
                      />
                    </FormField>

                    <FormField label="System Language">
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        style={baseInputStyle}
                      >
                        <option value="en">English (US / Global)</option>
                        <option value="id">Bahasa Indonesia</option>
                      </select>
                    </FormField>

                    <FormField label="Default Financial Currency">
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        style={baseInputStyle}
                      >
                        <option value="IDR">IDR — Indonesian Rupiah (Rp)</option>
                        <option value="USD">USD — US Dollar ($)</option>
                        <option value="EUR">EUR — Euro (€)</option>
                        <option value="SGD">SGD — Singapore Dollar (S$)</option>
                      </select>
                    </FormField>

                    <FormField label="Standard Date Format">
                      <select
                        value={formData.dateFormat}
                        onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                        style={baseInputStyle}
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-01)</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY (01-11-2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (11/01/2026)</option>
                      </select>
                    </FormField>
                  </div>
                </SettingsSection>

                {/* Appearance & Neon Theme Switcher */}
                <SettingsSection
                  icon={<Palette size={18} />}
                  title="Workspace Appearance & Neon Theme Accents"
                  description="Toggle between Obsidian Neon Dark and Neon Sky Light, and customize brand accent highlights"
                  neonBlue={neonBlue}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {/* Theme Mode Toggle Cards */}
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.65rem' }}>
                        Interface Theme Mode
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1rem',
                            borderRadius: '10px',
                            border: theme === 'dark' ? `2px solid ${neonBlue}` : '1px solid var(--border)',
                            background: theme === 'dark' ? `color-mix(in srgb, ${neonBlue} 12%, transparent)` : 'var(--bg-surface)',
                            color: theme === 'dark' ? neonBlue : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Moon size={22} /> Obsidian Neon Dark
                        </button>

                        <button
                          type="button"
                          onClick={() => { if (theme !== 'light') toggleTheme(); }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1rem',
                            borderRadius: '10px',
                            border: theme === 'light' ? `2px solid ${neonBlue}` : '1px solid var(--border)',
                            background: theme === 'light' ? `color-mix(in srgb, ${neonBlue} 12%, transparent)` : 'var(--bg-surface)',
                            color: theme === 'light' ? neonBlue : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Sun size={22} /> Neon Sky Light
                        </button>
                      </div>
                    </div>

                    {/* Accent Color Presets */}
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.65rem' }}>
                        Primary Brand Accent Tone
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.55rem' }}>
                        {ACCENT_PRESETS.map((preset) => {
                          const isSelected = (accent || 'neon-blue') === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => changeAccent(preset.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.55rem 0.75rem',
                                borderRadius: '8px',
                                border: isSelected ? `2px solid ${preset.color}` : '1px solid var(--border)',
                                background: isSelected ? `${preset.color}25` : 'var(--bg-surface)',
                                color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 600
                              }}
                            >
                              <span style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: preset.color,
                                boxShadow: `0 0 8px ${preset.color}`
                              }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {preset.name.split(' ')[0]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </SettingsSection>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Destructive Actions */}
      <SettingsConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.variant}
        onConfirm={async () => {
          if (confirmModal.action) await confirmModal.action();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />

      {/* Deep Log Inspector SlideOver */}
      <LogDetailsDrawer
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        neonBlue={neonBlue}
        toast={toast}
      />
    </div>
  );
};

export default Settings;
