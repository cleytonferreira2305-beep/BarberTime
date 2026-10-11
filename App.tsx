import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Navbar } from './components/ui/Navbar';
import { Footer } from './components/ui/Footer';
import { SupabaseConfigModal } from './components/ui/SupabaseConfigModal';
import { HomePage } from './components/public/HomePage';
import { SearchPage } from './components/public/SearchPage';
import { ProfessionalPublicProfile } from './components/public/ProfessionalPublicProfile';
import { MyAppointments } from './components/client/MyAppointments';
import { BookingFlowModal } from './components/booking/BookingFlowModal';
import { ProfessionalLayout } from './components/professional/ProfessionalLayout';
import { ProfessionalDashboard } from './components/professional/ProfessionalDashboard';
import { ProfessionalSchedule } from './components/professional/ProfessionalSchedule';
import { ProfessionalServices } from './components/professional/ProfessionalServices';
import { ProfessionalAvailability } from './components/professional/ProfessionalAvailability';
import { ProfessionalProfileEdit } from './components/professional/ProfessionalProfileEdit';
import { WhatsAppReminderQueue } from './components/professional/WhatsAppReminderQueue';
import { AuthPage } from './components/auth/AuthPage';
import { Profissional } from './types';

function MainApp() {
  const { user, perfil, profissional } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'professional-profile' | 'my-appointments' | 'professional-dashboard' | 'auth'>('home');
  const [viewParams, setViewParams] = useState<any>({});

  // Professional Admin Tab State
  const [proActiveTab, setProActiveTab] = useState<'dashboard' | 'agenda' | 'servicos' | 'disponibilidade' | 'perfil' | 'lembretes'>('dashboard');

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedProfForBooking, setSelectedProfForBooking] = useState<Profissional | null>(null);
  const [initialServiceForBooking, setInitialServiceForBooking] = useState<string | undefined>(undefined);

  // Supabase Config Modal State
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Suporte a rotas encurtadas via Hash ou Path:
  // Ex: #/p/dom-barba ou #/profissional/dom-barba ou #p/dom-barba
  useEffect(() => {
    const handleUrlRouting = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      // 1. Verifica Hash routing: #/p/:slug ou #p/:slug ou #/profissional/:slug
      const shortHashMatch = hash.match(/^#\/?p\/([a-zA-Z0-9_-]+)/);
      const fullHashMatch = hash.match(/^#\/?profissional\/([a-zA-Z0-9_-]+)/);
      const slugFromHash = shortHashMatch?.[1] || fullHashMatch?.[1];

      if (slugFromHash) {
        setCurrentView('professional-profile');
        setViewParams({ slug: slugFromHash });
        return;
      }

      // 2. Verifica Path routing se disponível: /p/:slug ou /profissional/:slug
      const shortPathMatch = pathname.match(/^\/p\/([a-zA-Z0-9_-]+)/);
      const fullPathMatch = pathname.match(/^\/profissional\/([a-zA-Z0-9_-]+)/);
      const slugFromPath = shortPathMatch?.[1] || fullPathMatch?.[1];

      if (slugFromPath) {
        setCurrentView('professional-profile');
        setViewParams({ slug: slugFromPath });
      }
    };

    handleUrlRouting();
    window.addEventListener('hashchange', handleUrlRouting);
    return () => window.removeEventListener('hashchange', handleUrlRouting);
  }, []);

  const handleNavigate = (view: string, params: any = {}) => {
    setCurrentView(view as any);
    setViewParams(params);
    if (params?.tab) {
      setProActiveTab(params.tab);
    }
    // Sincroniza hash se for perfil profissional
    if (view === 'professional-profile' && params?.slug) {
      window.location.hash = `/p/${params.slug}`;
    } else if (view === 'home' && window.location.hash.startsWith('#/p/')) {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBooking = (prof: Profissional, initialServiceId?: string) => {
    setSelectedProfForBooking(prof);
    setInitialServiceForBooking(initialServiceId);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
      />

      <main className="flex-1">
        {/* 1. Home */}
        {currentView === 'home' && (
          <HomePage
            onSelectProfessional={handleOpenBooking}
            onNavigate={handleNavigate}
          />
        )}

        {/* 2. Busca */}
        {currentView === 'search' && (
          <SearchPage
            initialQuery={viewParams.query || ''}
            initialCategoria={viewParams.categoria || 'todos'}
            onSelectProfessional={handleOpenBooking}
            onNavigate={handleNavigate}
          />
        )}

        {/* 3. Perfil Público do Profissional (/profissional/[slug]) */}
        {currentView === 'professional-profile' && (
          <ProfessionalPublicProfile
            slug={viewParams.slug || 'dom-barba'}
            onOpenBooking={handleOpenBooking}
            onBack={() => handleNavigate('search')}
          />
        )}

        {/* 4. Meus Agendamentos (Cliente) */}
        {currentView === 'my-appointments' && (
          <MyAppointments
            onNavigate={handleNavigate}
            onReagendar={(prof, serviceId) => handleOpenBooking(prof, serviceId)}
          />
        )}

        {/* 5. Painel do Profissional (Protegido por login) */}
        {currentView === 'professional-dashboard' && (
          <>
            {profissional ? (
              <ProfessionalLayout
                profissional={profissional}
                activeTab={proActiveTab}
                onChangeTab={setProActiveTab}
                onViewPublicProfile={(slug) => handleNavigate('professional-profile', { slug })}
              >
                {proActiveTab === 'dashboard' && (
                  <ProfessionalDashboard
                    profissional={profissional}
                    onGoToAgenda={() => setProActiveTab('agenda')}
                    onGoToServicos={() => setProActiveTab('servicos')}
                    onGoToLembretes={() => setProActiveTab('lembretes')}
                  />
                )}
                {proActiveTab === 'agenda' && (
                  <ProfessionalSchedule profissional={profissional} />
                )}
                {proActiveTab === 'servicos' && (
                  <ProfessionalServices profissional={profissional} />
                )}
                {proActiveTab === 'disponibilidade' && (
                  <ProfessionalAvailability profissional={profissional} />
                )}
                {proActiveTab === 'lembretes' && (
                  <WhatsAppReminderQueue profissional={profissional} />
                )}
                {proActiveTab === 'perfil' && (
                  <ProfessionalProfileEdit profissional={profissional} />
                )}
              </ProfessionalLayout>
            ) : (
              <AuthPage
                initialMode="register-pro"
                onSuccess={() => handleNavigate('professional-dashboard')}
                onCancel={() => handleNavigate('home')}
              />
            )}
          </>
        )}

        {/* 6. Autenticação (Login / Cadastro) */}
        {currentView === 'auth' && (
          <AuthPage
            initialMode={viewParams.mode || 'login'}
            onSuccess={() => {
              if (viewParams.mode === 'register-pro' || viewParams.mode === 'demo-pro') {
                handleNavigate('professional-dashboard');
              } else {
                handleNavigate('home');
              }
            }}
            onCancel={() => handleNavigate('home')}
          />
        )}
      </main>

      <Footer
        onNavigate={handleNavigate}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
      />

      {/* Modal de Agendamento Atômico */}
      {bookingModalOpen && selectedProfForBooking && (
        <BookingFlowModal
          profissional={selectedProfForBooking}
          isOpen={bookingModalOpen}
          initialServiceId={initialServiceForBooking}
          onClose={() => setBookingModalOpen(false)}
          onGoToMyAppointments={() => handleNavigate('my-appointments')}
        />
      )}

      {/* Modal de Banco & Supabase */}
      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
