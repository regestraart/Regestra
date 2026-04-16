import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layout/Layout';
import { UserProvider } from './context/UserContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import ScrollToTop from './components/ScrollToTop';
import { OnboardingGate } from './components/OnboardingGate';

import Landing from './pages/Landing';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import UploadArtwork from './pages/UploadArtwork';
import Messages from './pages/Messages';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import Welcome from './pages/Welcome';
import MagicLink from './pages/MagicLink';
import ArtworkView from './pages/ArtworkView';
import Marketplace from './pages/Marketplace';
import Admin from './pages/Admin';
import AdminRoute from './components/AdminRoute';
import VerifyCertificate from './pages/VerifyCertificate';
import Subscription from './pages/Subscription';
import ClaimArtwork from './pages/ClaimArtwork';
import CertExplorer from './pages/CertExplorer';
import CertWallet from './pages/CertWallet';
import Onboarding from './pages/Onboarding';
import ConfirmSignup from './pages/ConfirmSignup';

function App() {
  return (
    <UserProvider>
      <SubscriptionProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
              {/* Public verify + explorer routes — no Layout chrome */}
              <Route path="/verify/:certNumber" element={<VerifyCertificate />} />
              <Route path="/verify"             element={<VerifyCertificate />} />
              <Route path="/explorer"           element={<CertExplorer />} />
              <Route path="/onboarding"         element={<Onboarding />} />
              <Route path="/confirm-signup"     element={<ConfirmSignup />} />
              <Route path="/sign-up"            element={<SignUp />} />

              <Route element={<Layout />}>
                <Route path="/auth-callback"              element={<AuthCallback />} />
                <Route path="/"                           element={<Landing />} />
                <Route path="/gallery"                    element={<Gallery />} />
                <Route path="/login"                      element={<Login />} />
                <Route path="/welcome"                    element={<Welcome />} />
                <Route path="/forgot-password"            element={<ForgotPassword />} />
                <Route path="/magic-link"                 element={<MagicLink />} />
                <Route path="/update-password"            element={<UpdatePassword />} />
                <Route path="/profile/:username"          element={<Profile />} />
                <Route path="/upload"                     element={<UploadArtwork />} />
                <Route path="/messages"                   element={<Messages />} />
                <Route path="/marketplace"                element={<Marketplace />} />
                <Route path="/artwork/:artworkId"         element={<ArtworkView type="artwork" />} />
                <Route path="/collect/:userId/:artworkId" element={<ArtworkView type="collection" />} />
                <Route path="/subscription"               element={<Subscription />} />
                <Route path="/claim"                      element={<ClaimArtwork />} />
                <Route path="/wallet"                     element={<CertWallet />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
                <Route path="*" element={<Landing />} />
              </Route>
            </Routes>
        </BrowserRouter>
      </SubscriptionProvider>
    </UserProvider>
  );
}

export default App;
