<script setup lang="ts">
import '@fortawesome/fontawesome-free'
import '@fortawesome/free-solid-svg-icons'
</script>

<template class="app-footer">
  <div>
    <p>Powered by Open-Meteo Weather API</p>
  <div class="social-links">
    <a href="mailto:koringo.w.brian@gmail.com" class="social-link" aria-label="Email" target="_blank">
      <i class="fas fa-envelope"></i><span class="sr-only">Email</span>
    </a>
    <!-- <a href="tel:+" class="social-link" aria-label="Phone">
      <i class="fas fa-phone-alt"></i><span class="sr-only">Phone</span>
    </a> -->
    <a href="https://github.com/StealthyScripter/" class="social-link" aria-label="GitHub" target="_blank">
      <i class="fab fa-github"></i><span class="sr-only">GitHub</span>
    </a>
    <a href="https://brianwendot.com/" class="social-link" aria-label="GitHub" target="_blank">
      <i class="fa-solid fa-globe"></i><span class="sr-only">GitHub</span>
    </a>
  </div>
  </div>

</template>


<style scoped>
  .app-footer {
    background-color: #2c3e50;
    color: white;
    padding: 16px;
    display: flex;
    font-size: 0.9rem;
  }

  .social-links {
    display: flex;
    gap: 16px;
  }

  .social-link {
    color: #2c3e50;
    text-decoration: none;
    font-size: 1.5rem;  /* Adjust icon size */
  }

  .social-link:hover {
    color: #3498db; /* Optional: Add hover effect */
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
