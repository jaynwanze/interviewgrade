'use client';

import { RHFSelect } from '@/components/RHFSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    availableCountriesCandidates,
    availableIndustriesCandidates,
    availableRolesCandidates,
} from '@/utils/filterOptions';

import {
    updateCandidateDetails,
    uploadPublicCandidateResume,
} from '@/data/user/candidate';
import { useSAToastMutation } from '@/hooks/useSAToastMutation';

import type { Candidate } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { LucideDelete } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    phone_number: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    role: z.string().min(1, 'Role is required'),
    industry: z.string().min(1, 'Industry is required'),
    linkedin_url: z.string().optional(),
    resume_url: z.any().optional(),
});
type FormVals = z.infer<typeof schema>;

export function CandidateDetailsFormClient({
    initial,
}: {
    initial?: Candidate;
}) {
    const {
        control,
        register,
        handleSubmit,
        setValue,
        formState: { errors, isValid },
    } = useForm<FormVals>({
        mode: 'onChange',
        resolver: zodResolver(schema),
        defaultValues: {
            phone_number: initial?.phone_number ?? '',
            city: initial?.city ?? '',
            country: initial?.country ?? '',
            role: initial?.role ?? '',
            industry: initial?.industry ?? '',
            linkedin_url: initial?.linkedin_url ?? '',
            resume_url: (initial?.resume_url as unknown as File) ?? '',
        },
    });

    /* upload resume ──────────────── */
    const [uploading, setUploading] = useState(false);
    const [resumeURL, setResumeURL] = useState(initial?.resume_url ?? '');

    const { mutate: upload } = useSAToastMutation(
        async (file: File) => {
            const fd = new FormData();
            fd.append('file', file);
            return uploadPublicCandidateResume(fd, file.name);
        },
        {
            loadingMessage: 'Uploading résumé…',
            successMessage: 'Résumé uploaded!',
            errorMessage: 'Upload failed',
            onMutate: () => setUploading(true),
            onError: () => setUploading(false),
            onSuccess: (r) => {
                setUploading(false);
                if (r.status === 'success') {
                    setResumeURL(r.data);
                    setValue('resume_url', r.data as unknown as File); // keep RHF happy
                }
            },
        },
    );

    function handleRemoveResume() {
        setResumeURL('');
        setValue('resume_url', '' as unknown as File); // keep RHF happy
    }

    /* save details ──────────────── */
    const { mutate: save, isLoading } = useSAToastMutation(
        async (vals: FormVals) =>
            updateCandidateDetails({
                city: vals.city,
                country: vals.country,
                phoneNumber: vals.phone_number || undefined,
                role: vals.role,
                industry: vals.industry,
                linkedin_url: vals.linkedin_url,
                resume_url: resumeURL || undefined,
            }),
        {
            successMessage: 'Details saved!',
            errorMessage: 'Could not save',
        },
    );

    return (
        <form
            onSubmit={handleSubmit((d) => save(d))}
            className="space-y-4"
            data-testid="candidate-details-form"
        >
            {/* city + country */}
            <div className="flex gap-3">
                <span className="flex-1">
                    <Label>City</Label>
                    <Input placeholder="e.g. Dublin" {...register('city')} />
                    {errors.city && (
                        <p className="text-xs text-red-600">{errors.city.message}</p>
                    )}
                </span>

                <span className="flex-1">
                    <Label>Country</Label>
                    <RHFSelect
                        control={control}
                        className="w-full md:w-[180px]"
                        name="country"
                        placeholder="Select…"
                        options={availableCountriesCandidates}
                    />
                    {errors.country && (
                        <p className="text-xs text-red-600">{errors.country.message}</p>
                    )}
                </span>
            </div>

            {/* phone + role */}
            <div className="flex gap-3">
                <span className="flex-1">
                    <Label>Phone number</Label>
                    <Input placeholder="(555) 123-4567" {...register('phone_number')} />
                    {errors.phone_number && (
                        <p className="text-xs text-red-600">
                            {errors.phone_number.message}
                        </p>
                    )}
                </span>

                <span className="flex-1">
                    <Label>Role</Label>
                    <RHFSelect
                        control={control}
                        className="w-full md:w-[180px]"
                        name="role"
                        placeholder="All Roles…"
                        options={availableRolesCandidates}
                    />
                    {errors.role && (
                        <p className="text-xs text-red-600">{errors.role.message}</p>
                    )}
                </span>
            </div>

            <div className="flex-1 ">
                {/* industry */}
                <Label>Industry</Label>
                <RHFSelect
                    control={control}
                    name="industry"
                    placeholder="All Industries…"
                    options={availableIndustriesCandidates}
                />
                {errors.industry && (
                    <p className="text-xs text-red-600">{errors.industry.message}</p>
                )}
            </div>

            {/* linkedin */}
            <div className="flex-1 ">
                <Label>LinkedIn</Label>
                <Input placeholder="LinkedIn URL" {...register('linkedin_url')} />
            </div>

            <div className="flex-1 ">
                <Label>Résumé (PDF)</Label>
                {resumeURL ? (
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-emerald-600">
                            Stored resume:{' '}
                            <a
                                href={resumeURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                view file
                            </a>
                        </p>

                        <span className="flex justify-end ml-auto gap-1">
                            <p className="text-xs text-muted-foreground text-red-600">
                                Remove
                            </p>
                            <button type="button" onClick={handleRemoveResume}>
                                <LucideDelete className="h-4 w-4 text-red-600" />
                            </button>
                        </span>
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-muted-foreground">
                            No résumé on file (optional)
                        </p>
                        <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                        />
                        {uploading && <p className="text-xs">Uploading…</p>}
                    </>
                )}
            </div>

            {/* hidden field so RHF has resume_url in its values */}
            <input type="hidden" {...register('resume_url')} />

            <Button
                type="submit"
                disabled={!isValid || uploading || isLoading}
                className="w-full"
            >
                {isLoading ? 'Saving…' : 'Save'}
            </Button>
        </form>
    );
}
