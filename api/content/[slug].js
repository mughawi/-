export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop().replace('.json', '');
  
  const allowedPages = ['ng', 'kl', 'h', 'h1', 'mu', 'makah', 'asl', 'azkar'];
  
  if (!allowedPages.includes(slug)) {
    return new Response(
      JSON.stringify({ error: 'Page not found' }), 
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    const response = await fetch(`https://opal-two-58.vercel.app/data/${slug}.txt`);
    const text = await response.text();
    
    // تقسيم المحتوى على الفاصل |
    const parts = text.split('|');
    const containers = {};
    
    parts.forEach((content, index) => {
      if (content.trim() !== "") {
        const containerId = index === 0 ? 'text-container' : `text-container-${index + 1}`;
        containers[containerId] = processContent(content.trim());
      }
    });
    
    const title = getPageTitle(slug);
    
    return new Response(
      JSON.stringify({ 
        title, 
        containers  // إرجاع كل الـ containers
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=86400',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to load' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function processContent(text) {
  let processed = text.trim();
  
  // تبسيط المسافات
  processed = processed.replace(/[ \t]+/g, ' ');
  
  // العناوين
  processed = processed.replace(/^###\s+(.*)/gm, '<h3>$1</h3>');
  processed = processed.replace(/^##\s+(.*)/gm, '<h2>$1</h2>');
  processed = processed.replace(/^#\s+(.*)/gm, '<h1>$1</h1>');
  
  // النقاط والأرقام
  processed = processed.replace(/^[ \t]*-[ \t]*/gm, '<span class="manual-bullet">● </span>');
  processed = processed.replace(/^(\d+[\.\-]\s*)/gm, '<span class="manual-number">$1</span>');
  
  // التظليل والعريض
  processed = processed.replace(/==(.*?)==/g, '<mark>$1</mark>');
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // الآيات والمراجع
  processed = processed.replace(/(﴿[^﴾]+﴾)/g, '<span class="quran-text">$1</span>');
  processed = processed.replace(/(\[[^\]]+\])/g, '<span class="quran-ref">$1</span>');
  processed = processed.replace(/(\[(?:متفق عليه|رواه .+?|صحيح .+?|ضعيف .+?)\])/g, '<span class="quran-ref">$1</span>');
  
  // الأحاديث
  processed = processed.replace(/\(([^)]+?)\)/g, '<div class="hadith-box">($1)</div>');
  
  // تحويل السطور إلى قائمة
  const lines = processed.split('\n').filter(line => line.trim() !== '');
  let html = '<ol>';
  lines.forEach(line => {
    if (line.trim() !== '') {
      html += '<li>' + line.trim() + '</li>';
    }
  });
  html += '</ol>';
  
  return html;
}

function getPageTitle(slug) {
  const titles = {
    'ng': 'شروط قبول العمل الصالح',
    'kl': 'كلمة التوحيد',
    'h': 'غير نفسك',
    'h1': 'باب التوبة',
    'mu': 'أهل السنة والجماعة',
    'makah': 'محاسبة النفس',
    'asl': 'نواقض الإسلام',
    'azkar': 'الأذكار الشرعية'
  };
  return titles[slug] || 'محتوى علمي';
}

