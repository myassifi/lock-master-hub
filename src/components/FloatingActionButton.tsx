import { useState } from 'react';
import { Plus, Package, Users, Briefcase, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  color: string;
}

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      icon: Package,
      label: 'Add Inventory',
      action: () => {
        navigate('/inventory?action=add');
        setIsOpen(false);
      },
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Users,
      label: 'Add Customer',
      action: () => {
        navigate('/customers?action=add');
        setIsOpen(false);
      },
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: Briefcase,
      label: 'Add Job',
      action: () => {
        navigate('/jobs?action=add');
        setIsOpen(false);
      },
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="md:hidden">
      {/* Quick Action Buttons */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 space-y-3 z-40">
          {quickActions.map((action, index) => (
            <div
              key={action.label}
              className="flex items-center gap-3 slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="bg-card/95 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium border shadow-lg">
                {action.label}
              </span>
              <Button
                size="sm"
                className={`${action.color} text-white rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
                onClick={action.action}
              >
                <action.icon className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        className={`floating-action h-14 w-14 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary'
        } transition-all duration-300`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}