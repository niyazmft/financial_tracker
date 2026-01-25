<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-text-main">Privacy Policy</h1>
        <p class="mt-1 text-sm text-text-sub">Last updated: January 25, 2026</p>
    </div>

    <Card>
      <template #content>
        <div class="space-y-6 text-text-main leading-relaxed">
          <section>
            <h3 class="text-xl font-bold mb-2">1. Introduction</h3>
            <p>FinTrack ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our personal finance management application.</p>
          </section>
          
          <section>
            <h3 class="text-xl font-bold mb-2">2. Information We Collect</h3>
            <p>We collect information that you provide directly to us when you use the Service:</p>
            <ul class="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Account Information:</strong> When you register, we collect your email address and authentication credentials via our third-party provider (Firebase Authentication).</li>
                <li><strong>Financial Data:</strong> We store the transaction data, budgets, savings goals, and subscription details that you voluntarily input or import into the application.</li>
                <li><strong>Usage Data:</strong> We may collect anonymous information about how you access and use the Service, such as pages viewed and features used.</li>
            </ul>
          </section>
          
          <section>
            <h3 class="text-xl font-bold mb-2">3. How We Use Your Information</h3>
            <p>We use the collected data for specific purposes:</p>
            <ul class="list-disc ml-6 mt-2 space-y-1">
                <li>To provide, operate, and maintain the FinTrack application.</li>
                <li>To personalize your dashboard and financial insights.</li>
                <li>To generate aggregated, anonymous statistics for internal analysis.</li>
                <li>To detect and prevent fraudulent activity.</li>
            </ul>
          </section>

          <section>
            <h3 class="text-xl font-bold mb-2">4. Third-Party Services</h3>
            <p>We may share data with the following trusted third-party service providers solely for the purpose of operating our Service:</p>
            <ul class="list-disc ml-6 mt-2 space-y-1">
                <li><strong>Google Firebase:</strong> For user authentication and hosting infrastructure.</li>
                <li><strong>NocoDB:</strong> As our primary database for storing structured financial records.</li>
            </ul>
            <p class="mt-2 text-sm text-text-sub">We do not sell, trade, or rent your personal identification information to others.</p>
          </section>
          
          <section>
            <h3 class="text-xl font-bold mb-2">5. Data Security</h3>
            <p>We implement appropriate technical and organizational security measures to protect your data. Your financial data is stored in secure databases, and all data transmission occurs over encrypted SSL/TLS connections. However, please be aware that no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h3 class="text-xl font-bold mb-2">6. Your Data Rights</h3>
            <p>Depending on your location, you may have the right to access, correct, or delete the personal data we hold about you. You can delete your financial data directly within the application or contact us to request full account deletion.</p>
          </section>

          <section>
            <h3 class="text-xl font-bold mb-2">7. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <p class="mt-2 text-primary font-medium">By email: support@fintrack.app</p>
          </section>
        </div>

        <div class="mt-10 pt-6 border-t border-border-base flex justify-start">
            <router-link to="/login">
                <Button label="Back to Login" icon="pi pi-arrow-left" severity="secondary" outlined />
            </router-link>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card';
import Button from 'primevue/button';
</script>
