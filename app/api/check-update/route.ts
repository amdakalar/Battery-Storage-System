import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const repo = 'amdakalar/Battery-Storage-System';
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        'User-Agent': 'Battery-Storage-System',
      },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        latestVersion: data.tag_name || data.name || '',
        releaseName: data.name || data.tag_name || '',
        releaseNotes: data.body || '',
        htmlUrl: data.html_url || `https://github.com/${repo}`,
      });
    }
    return NextResponse.json({ success: false });
  } catch {
    return NextResponse.json({ success: false });
  }
}
