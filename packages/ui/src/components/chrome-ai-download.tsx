import { Progress } from './progress';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export interface ChromeAIDownloadProps {
  /** Current download progress (0-1) */
  progress: number;
  /** Current status message */
  status: string;
  /** Whether download is in progress */
  isDownloading: boolean;
  /** Whether download has completed */
  isComplete: boolean;
  /** Whether an error occurred */
  hasError: boolean;
  /** Error message if any */
  errorMessage?: string;
  /** Callback to start download */
  onStartDownload?: () => void;
  /** Callback to retry download */
  onRetry?: () => void;
  /** Callback to cancel download */
  onCancel?: () => void;
  /** Callback when complete and user wants to continue */
  onContinue?: () => void;
}

/**
 * Full-page component for downloading Chrome AI (Gemini Nano) model
 * Shows progress bar and status during download
 */
export function ChromeAIDownloadPage({
  progress,
  status,
  isDownloading,
  isComplete,
  hasError,
  errorMessage,
  onStartDownload,
  onRetry,
  onCancel,
  onContinue,
}: ChromeAIDownloadProps) {
  const progressPercent = Math.round(progress * 100);

  return (
    <div className="flex min-h-[600px] items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            {isComplete ? (
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : hasError ? (
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-primary animate-pulse"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <CardTitle className="text-2xl">
            {isComplete
              ? 'Chrome AI Ready!'
              : hasError
                ? 'Download Failed'
                : 'Chrome AI Setup'}
          </CardTitle>
          <CardDescription>
            {isComplete
              ? 'The Gemini Nano model is now available for use.'
              : hasError
                ? 'An error occurred during the download.'
                : 'Setting up local AI capabilities for WiserPin'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isComplete && !hasError && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{status}</span>
                    <span className="font-semibold text-primary">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>

                <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="space-y-1 text-muted-foreground">
                      <p>One-time download required</p>
                      <p>Runs entirely in your browser for privacy</p>
                      <p>No data sent to external servers</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {hasError && (
            <div className="space-y-4">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive">
                  {errorMessage || 'Failed to download the model. Please try again.'}
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Make sure you have:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Chrome 128 or later</li>
                  <li>At least 22GB of free storage</li>
                  <li>A stable internet connection</li>
                </ul>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Chrome AI is ready to use! You can now generate intelligent summaries
                  using the local Gemini Nano model.
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Benefits of Chrome AI:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Fast, local processing</li>
                  <li>Complete privacy - no data leaves your device</li>
                  <li>Works offline</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {!isComplete && !hasError && !isDownloading && onStartDownload && (
              <>
                <Button onClick={onStartDownload} size="lg" className="w-full">
                  Start Download
                </Button>
                {onCancel && (
                  <Button variant="ghost" onClick={onCancel} className="w-full">
                    Skip for now
                  </Button>
                )}
              </>
            )}

            {isDownloading && onCancel && (
              <Button variant="outline" onClick={onCancel} className="w-full">
                Cancel Download
              </Button>
            )}

            {hasError && (
              <>
                {onRetry && (
                  <Button onClick={onRetry} size="lg" className="w-full">
                    Retry Download
                  </Button>
                )}
                {onCancel && (
                  <Button variant="ghost" onClick={onCancel} className="w-full">
                    Skip for now
                  </Button>
                )}
              </>
            )}

            {isComplete && onContinue && (
              <Button onClick={onContinue} size="lg" className="w-full">
                Continue to WiserPin
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChromeAIDownloadPage;
