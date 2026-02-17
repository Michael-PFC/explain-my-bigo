import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="text-muted-foreground mt-6 flex items-center gap-4 text-xs">
      <Link href="/privacy" className="hover:underline" prefetch={false}>
        Privacy
      </Link>
      <Link
        href="https://github.com/Michael-PFC/explain-my-bigo"
        className="hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        prefetch={false}
      >
        GitHub
      </Link>
      <span className="ml-auto flex items-center gap-2">
        <span>Powered by</span>
        <Link
          href="https://pollinations.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          prefetch={false}
        >
          <Image
            src="https://raw.githubusercontent.com/pollinations/pollinations/main/assets/logo.svg"
            alt="Pollinations"
            width={16}
            height={16}
            className="h-4 w-4"
            unoptimized
          />
          <span>Pollinations</span>
        </Link>
      </span>
    </footer>
  );
}
