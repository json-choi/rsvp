import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "정동젊은이교회 새가족잔치",
  description: "정동젊은이교회 새가족 여러분을 환영합니다. 함께하는 첫 번째 축제에 초대합니다.",
  openGraph: {
    title: "정동젊은이교회 새가족잔치",
    description: "정동젊은이교회 새가족 여러분을 환영합니다.",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
