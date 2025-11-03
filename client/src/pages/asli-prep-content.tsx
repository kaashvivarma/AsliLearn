import { useState } from 'react';
import Navigation from '@/components/navigation';
import AsliPrepContent from '@/components/student/asli-prep-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AsliPrepContentPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 via-pink-50 to-orange-50 pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">AP</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Asli Learn Exclusive</h1>
                <p className="text-gray-600">Premium study materials created by Super Admin</p>
              </div>
            </div>
          </div>
          <AsliPrepContent />
        </div>
      </div>
    </>
  );
}

