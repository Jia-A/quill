"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditorClient(props: React.ComponentProps<typeof Editor>) {
  return <Editor {...props} />;
}
