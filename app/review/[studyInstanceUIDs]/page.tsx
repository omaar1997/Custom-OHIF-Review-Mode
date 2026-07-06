import { RadiologyReviewMode } from "@/src/features/radiology-review/components/RadiologyReviewMode";

type ReviewPageProps = {
  params: Promise<{ studyInstanceUIDs: string }>;
  searchParams?: Promise<{ modality?: string }>;
};

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const { studyInstanceUIDs } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  return <RadiologyReviewMode studyInstanceUIDs={studyInstanceUIDs} modality={resolvedSearchParams.modality} />;
}
