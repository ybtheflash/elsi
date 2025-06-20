import { CheckCircle, Clock, AlertCircle, Award, FileText, Link as LinkIcon, Edit, MessageSquare, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Submission = {
    id: string;
    internName?: string;
    title: string;
    domain: string;
    description?: string;
    links?: string[];
    fileDetails?: { id: string; name: string }[];
    status: 'pending' | 'approved' | 'revision_needed';
    points: number;
    feedback?: string;
    submittedAt?: any;
    taskName?: string;
};

interface SubmissionCardProps {
    submission: Submission;
    isCompact?: boolean;
    showInternName?: boolean;
    onEdit?: (submission: Submission) => void;
    onResubmit?: (submission: Submission) => void;
    onViewFeedback?: (feedback: string) => void;
    onGrade?: (submission: Submission) => void;
    canEdit?: boolean;
    canResubmit?: boolean;
}

const statusConfig = {
    pending: {
        icon: Clock,
        color: 'bg-yellow-500/20 text-yellow-700 border-yellow-300',
        label: 'Pending Review'
    },
    approved: {
        icon: CheckCircle,
        color: 'bg-green-500/20 text-green-700 border-green-300',
        label: 'Approved'
    },
    revision_needed: {
        icon: AlertCircle,
        color: 'bg-red-500/20 text-red-700 border-red-300',
        label: 'Needs Revision'
    }
};

export function SubmissionCard({
    submission,
    isCompact = false,
    showInternName = false,
    onEdit,
    onResubmit,
    onViewFeedback,
    onGrade,
    canEdit = false,
    canResubmit = false
}: SubmissionCardProps) {
    const config = statusConfig[submission.status];
    const StatusIcon = config.icon;
    
    const submittedDate = submission.submittedAt?.toDate?.() || new Date();
    const formattedDate = submittedDate.toLocaleDateString();
    const formattedTime = submittedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isCompact) {
        return (
            <div className="glass-container p-3 hover:shadow-lg transition-all duration-200 border-l-4 border-lilac-400">
                <div className="flex items-center justify-between gap-3">
                    {/* Left side - Main info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800 text-sm truncate">
                                {submission.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-lilac-100 text-lilac-700">
                                {submission.domain}
                            </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                            {showInternName && submission.internName && (
                                <span className="flex items-center gap-1">
                                    <User size={12} />
                                    {submission.internName}
                                </span>
                            )}
                            {submission.taskName && (
                                <span className="truncate">{submission.taskName}</span>
                            )}
                            <span>{formattedDate}</span>
                        </div>
                    </div>

                    {/* Center - Status and Points */}
                    <div className="flex items-center gap-2">
                        <Badge className={`text-xs px-2 py-1 ${config.color} border`}>
                            <StatusIcon size={12} className="mr-1" />
                            {config.label}
                        </Badge>
                        
                        {submission.points > 0 && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-1">
                                <Award size={12} className="mr-1" />
                                {submission.points}
                            </Badge>
                        )}
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-1">
                        {submission.feedback && (
                            <Button
                                onClick={() => onViewFeedback?.(submission.feedback!)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
                            >
                                <MessageSquare size={14} />
                            </Button>
                        )}
                        
                        {canEdit && onEdit && (
                            <Button
                                onClick={() => onEdit(submission)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                            >
                                <Edit size={14} />
                            </Button>
                        )}
                        
                        {canResubmit && onResubmit && (
                            <Button
                                onClick={() => onResubmit(submission)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                            >
                                <FileText size={14} />
                            </Button>
                        )}
                        
                        {onGrade && (
                            <Button
                                onClick={() => onGrade(submission)}
                                size="sm"
                                className="h-8 px-3 bg-lilac-500 text-white hover:bg-lilac-600"
                            >
                                Grade
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Full card view
    return (
        <div className="glass-container p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{submission.title}</h3>
                        <Badge variant="secondary" className="bg-lilac-100 text-lilac-700 px-3 py-1">
                            {submission.domain}
                        </Badge>
                    </div>
                    
                    {showInternName && submission.internName && (
                        <p className="text-gray-600 mb-2 flex items-center gap-2">
                            <User size={16} />
                            <strong>Submitted by:</strong> {submission.internName}
                        </p>
                    )}
                    
                    {submission.taskName && (
                        <p className="text-gray-600 mb-2">
                            <strong>Task:</strong> {submission.taskName}
                        </p>
                    )}
                    
                    <p className="text-gray-600 mb-2">
                        <strong>Submitted:</strong> {formattedDate} at {formattedTime}
                    </p>
                    
                    {submission.description && (
                        <p className="text-gray-700 mb-4 leading-relaxed">
                            {submission.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 ml-4">
                    <Badge className={`px-3 py-2 ${config.color} border flex items-center gap-2`}>
                        <StatusIcon size={16} />
                        {config.label}
                    </Badge>
                    
                    {submission.points > 0 && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 flex items-center gap-2">
                            <Award size={16} />
                            {submission.points} points
                        </Badge>
                    )}
                </div>
            </div>

            {/* Files and Links */}
            {(submission.fileDetails?.length || submission.links?.length) && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {submission.fileDetails && submission.fileDetails.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <FileText size={16} />
                                    Files ({submission.fileDetails.length})
                                </h4>
                                <div className="space-y-2">
                                    {submission.fileDetails.slice(0, 3).map((file) => (
                                        <div key={file.id} className="p-2 bg-gray-50 rounded-lg text-sm">
                                            {file.name}
                                        </div>
                                    ))}
                                    {submission.fileDetails.length > 3 && (
                                        <p className="text-sm text-gray-500">
                                            +{submission.fileDetails.length - 3} more files
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {submission.links && submission.links.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <LinkIcon size={16} />
                                    Links ({submission.links.length})
                                </h4>
                                <div className="space-y-2">
                                    {submission.links.slice(0, 2).map((link, index) => (
                                        <a
                                            key={index}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors truncate"
                                        >
                                            {link}
                                        </a>
                                    ))}
                                    {submission.links.length > 2 && (
                                        <p className="text-sm text-gray-500">
                                            +{submission.links.length - 2} more links
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
                {submission.feedback && (
                    <Button
                        onClick={() => onViewFeedback?.(submission.feedback!)}
                        variant="outline"
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    >
                        <MessageSquare size={16} />
                        View Feedback
                    </Button>
                )}
                
                {canEdit && onEdit && (
                    <Button
                        onClick={() => onEdit(submission)}
                        variant="outline"
                        className="flex items-center gap-2 bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    >
                        <Edit size={16} />
                        Edit
                    </Button>
                )}
                
                {canResubmit && onResubmit && (
                    <Button
                        onClick={() => onResubmit(submission)}
                        variant="outline"
                        className="flex items-center gap-2 bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                    >
                        <FileText size={16} />
                        Resubmit
                    </Button>
                )}
                
                {onGrade && (
                    <Button
                        onClick={() => onGrade(submission)}
                        className="flex items-center gap-2 bg-lilac-500 text-white hover:bg-lilac-600"
                    >
                        <Award size={16} />
                        Grade Submission
                    </Button>
                )}
            </div>
        </div>
    );
}
