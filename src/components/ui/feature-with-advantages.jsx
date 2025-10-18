import { Check } from "lucide-react";
import Badge from "@components/ui/Badge";

// Helper function to sanitize subtext by removing trailing dashes and adding proper periods
const sanitizeSubtext = (text) => {
  let s = text.replace(/[—–-]\s*$/, '').trimEnd();
  if (!/[.!?]$/.test(s)) s += '.';
  // Ensure no double periods
  return s.replace(/\.{2,}/, '.');
};

function Feature() {
  return (
    <div className="w-full pt-8 md:pt-10 lg:pt-12 pb-20 lg:pb-40">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 flex-col items-start">
          <div>
            <Badge variant="default" className="lp-kicker">Included with Every Booking</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="lp-h2 lg:max-w-xl">
              Why Couples Choose Love & Photos
            </h2>
            <p className="text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-muted-foreground">
              Pro photos, zero hassle. We match you with vetted talent, keep pricing clear, and handle the details.
            </p>
          </div>
          <div className="flex gap-10 pt-12 flex-col w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 items-start lg:grid-cols-3 gap-10">
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Transparent Pricing</p>
                  <p className="text-muted-foreground text-sm">
                    {sanitizeSubtext('Clear, upfront pricing with no hidden fees or surprises—')}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Vetted Talent</p>
                  <p className="text-muted-foreground text-sm">
                    {sanitizeSubtext('All photographers are carefully screened and verified for quality—')}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Smart Matching</p>
                  <p className="text-muted-foreground text-sm">
                    {sanitizeSubtext('AI-powered matching finds the perfect photographer for your style—')}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Secure Payments</p>
                  <p className="text-muted-foreground text-sm">
                    {sanitizeSubtext('Safe, encrypted payment processing with buyer protection—')}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Auto Contracts</p>
                  <p className="text-muted-foreground text-sm">
                    {sanitizeSubtext('Automated legal contracts protect both you and your photographer—')}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Flexible Plans</p>
                  <p className="text-muted-foreground text-sm">
                    {sanitizeSubtext('Choose from packages or custom pricing to fit your needs—')}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 w-full items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Express Turnaround</p>
                  <p className="text-muted-foreground text-sm">
                    {sanitizeSubtext('Need photos fast? Express delivery options available—')}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">On-Time Media</p>
                  <p className="text-muted-foreground text-sm">
                    {sanitizeSubtext('Guaranteed delivery timelines with progress tracking—')}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium">24/7 Support</p>
                  <p className="text-muted-foreground text-sm">
                    {sanitizeSubtext('Our support team is here to help whenever you need us—')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };