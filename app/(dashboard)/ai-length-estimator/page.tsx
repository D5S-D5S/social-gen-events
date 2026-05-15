import AILengthEstimator from "@/components/quote/AILengthEstimator";
import ProFeatureGate from "@/components/ProFeatureGate";

export default function AILengthEstimatorPage() {
  return (
    <ProFeatureGate
      title="AI Length Estimator"
      description="The AI Length Estimator is available on BalloonBase Pro. Pro includes 200 shared AI usage tokens per month for estimator and mockup tools."
    >
      <AILengthEstimator />
    </ProFeatureGate>
  );
}
