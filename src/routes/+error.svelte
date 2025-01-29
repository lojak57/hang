<script>
  import { page } from '$app/stores';
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
  <h1 class="text-4xl font-bold text-gray-800 mb-4">
    {$page.status}: {$page.error?.message}
  </h1>
  <p class="text-gray-600 mb-8">
    Something went wrong. Please try again later.
  </p>
  <a
    href="/"
    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
  >
    Go back home
  </a>
</div>
