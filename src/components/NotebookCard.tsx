import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

interface NotebookCardProps {
  id: string;
  title: string;
  date: string;
  sources: number;
  color: string;
  icon: string;
  onRename?: (id: string, currentTitle: string) => void;
  onDelete?: (id: string, currentTitle: string) => void;
}

const NotebookCard = ({ id, title, date, sources, color, icon, onRename, onDelete }: NotebookCardProps) => {
  const navigate = useNavigate();
  return (
    <Card
      className={`shadow-sm cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 rounded-2xl border-0 ${color || ''}`}
      style={{ minWidth: 300, minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' }}
      onClick={() => navigate(`/workspace/${id}`)}
    >
      <div className="flex flex-col w-full h-full items-center justify-center relative gap-2">
        {/* Button dot menu (top-right absolute, but visually subtle) */}
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-70 hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onRename?.(id, title)}>Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(id, title)} className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <span className="text-5xl mb-2 mt-2 block text-center">{icon}</span>
        <div className="flex flex-col items-center text-center flex-grow w-full justify-center pt-2 pb-2">
          <h3 className="font-semibold text-lg mb-1 w-full text-center">{title}</h3>
          <p className="text-xs text-muted-foreground w-full text-center">{date} • {sources} sources</p>
        </div>
      </div>
    </Card>
  );
};

export default NotebookCard;
