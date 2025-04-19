
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { HighlightsCarousel } from "@/components/dashboard/highlights-carousel";
import { ProductsShowcase } from "@/components/dashboard/products-showcase";
import { AdsDisplay } from "@/components/dashboard/ads-display";

export default function Dashboard() {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();

  // Redirecionar usuários do plano gratuito para a página de planos
  useEffect(() => {
    if (user && user.plano === 'free' && user.role !== 'admin' && user.role !== 'master') {
      navigate("/plans");
    }
  }, [user, navigate]);

  return (
    <AppLayout title="Dashboard" subtitle="Bem-vindo ao Fornecedores">
      <div className="mb-8">
        <HighlightsCarousel />
      </div>
      
      <div className="mb-10">
        <AdsDisplay />
      </div>
      
      <div>
        <ProductsShowcase />
      </div>
    </AppLayout>
  );
}
