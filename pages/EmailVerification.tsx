
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";

export default function EmailVerification() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691b6257d4173f2ed6ec3e95/7495ad18b_RegestraLogo.png" 
            alt="Regestra" 
            className="h-10 mx-auto mb-6"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-purple-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Check Your Email
          </h1>
          
          <p className="text-gray-600 mb-8">
            We've sent a verification link to your email address. Please click the link to verify your account and get started.
          </p>

          <div className="bg-purple-50 rounded-2xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-left text-sm text-gray-700">
                <p className="font-medium mb-1">Didn't receive the email?</p>
                <p className="text-gray-600">Check your spam folder or click the button below to resend</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-xl font-semibold"
            >
              Resend Verification Email
            </Button>

            <Link to="/login">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-2"
              >
                Back to Login
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          Need help?{' '}
          <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}