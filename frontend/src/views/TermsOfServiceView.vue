<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-text-main">Terms of Service</h1>
        <p class="mt-1 text-sm text-text-sub">Last updated: January 25, 2026</p>
    </div>

    <Card>
      <template #content>
        <div class="space-y-6 text-text-main leading-relaxed">
          <section>
            <h3 class="text-xl font-bold mb-2">1. Use of Service</h3>
            <p>Welcome to FinTrack. By accessing or using our website, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of the terms, you may not access the service.</p>
            <p class="mt-2">FinTrack is a personal finance management tool designed to help you track expenses, budget, and forecast cash flow. You agree to use it only for lawful purposes.</p>
          </section>
          
          <section>
            <h3 class="text-xl font-bold mb-2">2. Accounts & Security</h3>
            <p>To use certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials (email and password) and for all activities that occur under your account.</p>
            <p class="mt-2">You agree to notify us immediately of any unauthorized use of your account or any other breach of security.</p>
          </section>
          
          <section>
            <h3 class="text-xl font-bold mb-2">3. Subscription & Payments</h3>
            <p>Some features of the Service may be billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis (such as monthly or annually).</p>
          </section>

          <section>
            <h3 class="text-xl font-bold mb-2">4. Termination</h3>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </section>
          
          <section>
            <h3 class="text-xl font-bold mb-2">5. Limitation of Liability</h3>
            <p>In no event shall FinTrack, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
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
