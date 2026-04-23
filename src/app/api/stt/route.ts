import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 업로드되지 않았습니다." }, { status: 400 });
    }

    // GMS 가이드의 curl 명령어를 그대로 구현
    const gmsFormData = new FormData();
    gmsFormData.append('file', file);
    gmsFormData.append('model', 'whisper-1');
    // 필요한 경우 language 추가 (선택 사항)
    // gmsFormData.append('language', 'ko');

    const response = await fetch("https://gms.ssafy.io/gmsapi/api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GMS_KEY}`,
        // 주의: fetch에서 FormData를 보낼 때는 Content-Type을 직접 설정하지 않습니다. 
        // 브라우저/노드가 자동으로 바운더리를 포함해 설정해줍니다.
      },
      body: gmsFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GMS 상세 에러:", errorText);
      return NextResponse.json({ 
        error: "GMS 서버 에러", 
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    const text = data.text || "";

    // 단어 빈도 분석 (띄어쓰기 기준)
    const words = text
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "") // 문장부호 제거
      .split(/\s+/)
      .filter((word: string) => word.length > 0);

    const wordCounts: Record<string, number> = {};
    words.forEach((word: string) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const sortedResult = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ 
      text: text, 
      result: sortedResult 
    });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}