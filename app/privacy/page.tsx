import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy | ExplainMyBigO",
  description:
    "Privacy policy for ExplainMyBigO - Learn how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 overflow-hidden">
      <div className="space-y-6 max-h-full overflow-y-auto [scrollbar-gutter:stable] prose prose-sm dark:prose-invert">
        <div>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">
            Last updated: February 17, 2026
          </p>
        </div>

        <div className="text-sm space-y-4">
          <p>
            ExplainMyBigO is designed to minimize data handling. This Privacy
            Policy explains what information is processed when you use the app
            and what choices you have.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1) What we collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              ExplainMyBigO does not require an account and is intended to
              operate without collecting personal information from users.
            </p>
            <p>
              For abuse prevention and rate limiting, our API may process your
              network address and transform it into a pseudonymous identifier
              (HMAC/hash) used only for short-lived security counters.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Local-only storage (IndexedDB)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              ExplainMyBigO may store data locally in your browser using
              IndexedDB, such as:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>local analysis history (if you enable/use this feature),</li>
              <li>UI preferences and settings,</li>
              <li>app state required for functionality.</li>
            </ul>
            <p>
              This data remains on your device unless you manually delete it.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3) Prompts, code, and user-provided content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              ExplainMyBigO is designed so that your prompts, code, and other
              content you enter are not stored on ExplainMyBigO servers. If the
              app provides history, it is stored locally on your device.
            </p>
            <p>
              We do not use your prompts or code for training our own models.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4) Data sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              We do not sell your data. ExplainMyBigO is not designed to share
              your prompts or locally stored content with third parties.
            </p>
            <p>
              Security-related processing (such as CAPTCHA validation and API
              abuse prevention) may involve specialized service providers acting
              on our instructions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5) Abuse prevention and rate limiting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              To protect service availability, we apply request throttling and
              temporary blocks when unusual traffic is detected.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                We do not store raw IP addresses in application-level rate limit
                keys.
              </li>
              <li>
                We use a pseudonymous identifier derived from your network
                address (HMAC/hash) for security counters.
              </li>
              <li>
                Rate-limit counters have short retention windows (for example,
                minute/day windows and temporary blocks) and automatically
                expire.
              </li>
            </ul>
            <p>
              This processing is used solely for security and abuse prevention,
              not for advertising or behavioral profiling.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6) Third-party services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Some features may involve third parties:</p>
            <div className="space-y-3">
              <div>
                <p className="font-semibold">
                  External LLM/API providers (optional):
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  If you choose to send content to an external provider, that
                  processing is governed by the provider&apos;s privacy policy.
                  ExplainMyBigO does not control third-party privacy practices.
                </p>
              </div>
              <div>
                <p className="font-semibold">Hosting / delivery providers:</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The website may be hosted or delivered through third-party
                  infrastructure (e.g., hosting platforms, CDNs, DDoS
                  protection). These providers may process basic server logs and
                  usage signals (such as IP address, user agent, requested
                  pages, timestamps, and security-related events) for delivery,
                  reliability, abuse prevention, and performance/security
                  monitoring. This processing occurs independently of
                  ExplainMyBigO and is governed by the provider&apos;s own
                  privacy policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7) Analytics and telemetry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              ExplainMyBigO does not aim to run user tracking. However, some
              technical analytics may be present due to hosting and delivery
              infrastructure (see &quot;Third-party services&quot;).
            </p>
            <p>
              If ExplainMyBigO introduces additional, app-level
              analytics/telemetry in the future (for example, to improve
              stability, understand feature usage, or diagnose errors), we will
              update this Privacy Policy accordingly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8) Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              ExplainMyBigO does not intentionally use advertising cookies.
              Hosting or delivery providers may use essential cookies or similar
              mechanisms for security, rate limiting, and service delivery.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9) How to delete your data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Because app data is stored locally, you can remove it at any time
              by:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                using an in-app &quot;Clear history / Clear data&quot; option
                (if available), and/or
              </li>
              <li>
                removing the site&apos;s storage via your browser settings (site
                data/storage).
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10) Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Keeping data local reduces exposure, but no system is perfectly
              secure. Your security also depends on your device, browser
              configuration, and installed extensions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11) Children&apos;s privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              ExplainMyBigO is not intended for children under 13. We do not
              knowingly collect personal information from children under 13.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12) Changes to this policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              We may update this policy over time. The &quot;Last updated&quot;
              date will reflect the most recent revision.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13) Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              If you have questions about this Privacy Policy, please contact us
              using the channel listed on the project&apos;s website or
              repository.
            </p>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center pb-4">
          <p>&copy; 2026 ExplainMyBigO. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
