import { ProjectDetail as ProjectDetailComponent } from "@/components/projects/project-detail";

interface ProjectDetailProps {
  id: number;
}

export default function ProjectDetail({ id }: ProjectDetailProps) {
  return (
    <div className="space-y-6">
      <ProjectDetailComponent projectId={id} />
    </div>
  );
}
