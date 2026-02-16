import Image from "next/image";

export function Footer() {
  return (
    <footer className="text-muted-foreground mt-6 flex items-center gap-4 text-xs">
      <a href="#" className="hover:underline">
        Privacy
      </a>
      <a href="#" className="hover:underline">
        GitHub
      </a>
      <span className="ml-auto flex items-center gap-2">
        <span>Powered by</span>
        <a
          href="https://pollinations.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
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
        </a>
      </span>
    </footer>
  );
}
