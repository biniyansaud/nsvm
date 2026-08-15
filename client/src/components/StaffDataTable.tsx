import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Users,
  X,
  Check,
  UserPlus,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import {
  SchoolStaffCategory,
  SchoolStaffMember,
  SecondaryDepartment,
  SecondaryStaffMember,
} from "@/lib/siteContent";
import { getAssetUrl } from "@/lib/assets";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";

type EditableCategory = SchoolStaffCategory | SecondaryDepartment;
type EditableMember = SchoolStaffMember | SecondaryStaffMember;

export interface FlattenedStaffRow {
  member: EditableMember;
  categoryId: string;
  categoryTitle: string;
  isSchoolStaff: boolean;
}

interface StaffDataTableProps {
  mode: "schoolStaff" | "secondaryStaff";
  categories: EditableCategory[];
  onChange: (categories: EditableCategory[]) => void;
  onUploadPhoto?: (file: File, categoryId: string, memberId: string) => void;
  onAddCategory?: () => void;
}

export default function StaffDataTable({
  mode,
  categories,
  onChange,
  onUploadPhoto,
  onAddCategory,
}: StaffDataTableProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "category" | "designation">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Editing state
  const [editingMemberRow, setEditingMemberRow] = useState<FlattenedStaffRow | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberCategory, setNewMemberCategory] = useState<string>(
    categories[0]?.id || ""
  );

  // Flatten staff data into rows
  const allRows = useMemo(() => {
    const rows: FlattenedStaffRow[] = [];
    categories.forEach((cat) => {
      cat.members.forEach((mem) => {
        rows.push({
          member: mem,
          categoryId: cat.id,
          categoryTitle: cat.title,
          isSchoolStaff: "designation" in mem,
        });
      });
    });
    return rows;
  }, [categories]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // Category Filter
      if (selectedCategoryFilter !== "all" && row.categoryId !== selectedCategoryFilter) {
        return false;
      }

      // Search Query Filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const nameMatch = row.member.name.toLowerCase().includes(q);
      const catMatch = row.categoryTitle.toLowerCase().includes(q);
      const expMatch = (row.member.expertise || "").toLowerCase().includes(q);
      const desMatch =
        "designation" in row.member ? row.member.designation.toLowerCase().includes(q) : false;
      const roleMatch =
        "officialRole" in row.member ? row.member.officialRole.toLowerCase().includes(q) : false;

      return nameMatch || catMatch || expMatch || desMatch || roleMatch;
    });
  }, [allRows, selectedCategoryFilter, searchQuery]);

  // Sort rows
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortField === "name") {
        valA = a.member.name.toLowerCase();
        valB = b.member.name.toLowerCase();
      } else if (sortField === "category") {
        valA = a.categoryTitle.toLowerCase();
        valB = b.categoryTitle.toLowerCase();
      } else if (sortField === "designation") {
        valA = ("designation" in a.member ? a.member.designation : a.member.expertise || "").toLowerCase();
        valB = ("designation" in b.member ? b.member.designation : b.member.expertise || "").toLowerCase();
      }

      const cmp = valA.localeCompare(valB);
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filteredRows, sortField, sortOrder]);

  // Paginated rows
  const totalItems = sortedRows.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, safePage, pageSize]);

  // Handlers
  const toggleSort = (field: "name" | "category" | "designation") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleUpdateMember = (updatedMember: EditableMember, targetCatId: string) => {
    const newCategories = categories.map((cat) => {
      // Remove from current category if moving to a different category
      const cleanedMembers = cat.members.filter((m) => m.id !== updatedMember.id);

      if (cat.id === targetCatId) {
        const existingIndex = cat.members.findIndex((m) => m.id === updatedMember.id);
        if (existingIndex >= 0) {
          // Replace inline
          const copy = [...cat.members];
          copy[existingIndex] = updatedMember;
          return { ...cat, members: copy };
        } else {
          // Add to new category
          return { ...cat, members: [updatedMember, ...cat.members] };
        }
      }

      return { ...cat, members: cleanedMembers };
    });

    onChange(newCategories as EditableCategory[]);
    setEditingMemberRow(null);
  };

  const handleDeleteMember = (categoryId: string, memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;

    const newCategories = categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          members: cat.members.filter((m) => m.id !== memberId),
        };
      }
      return cat;
    });

    onChange(newCategories as EditableCategory[]);
    if (editingMemberRow?.member.id === memberId) {
      setEditingMemberRow(null);
    }
  };

  const handleCreateMember = (catId: string) => {
    const targetCat = categories.find((c) => c.id === catId) || categories[0];
    if (!targetCat) return;

    const newId = `staff-${Date.now()}`;
    let newMem: EditableMember;

    if (mode === "schoolStaff") {
      newMem = {
        id: newId,
        name: "New Staff Member",
        designation: "Teacher",
        expertise: "",
        officialRole: "Teacher",
        image: "",
      } satisfies SchoolStaffMember;
    } else {
      newMem = {
        id: newId,
        name: "New Faculty Member",
        expertise: "Subject Teacher",
        image: "",
      } satisfies SecondaryStaffMember;
    }

    const updatedCategories = categories.map((cat) => {
      if (cat.id === targetCat.id) {
        return {
          ...cat,
          members: [newMem, ...cat.members],
        };
      }
      return cat;
    });

    onChange(updatedCategories as EditableCategory[]);
    setIsAddModalOpen(false);

    // Open edit modal for the newly created member
    setEditingMemberRow({
      member: newMem,
      categoryId: targetCat.id,
      categoryTitle: targetCat.title,
      isSchoolStaff: mode === "schoolStaff",
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Left: Search & Category Select */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Search ${allRows.length} staff members...`}
              aria-label="Search staff members"
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 py-2 text-sm font-medium text-slate-950 placeholder-slate-500 focus:border-teal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/25 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search input"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 rounded-md focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative min-w-[170px]">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Category or Department"
              className="w-full appearance-none rounded-xl border border-slate-300 bg-white pl-8 pr-7 py-2 text-xs font-bold text-slate-800 focus:border-teal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/25 cursor-pointer transition-all"
            >
              <option value="all">All Categories ({allRows.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title} ({cat.members.length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 justify-end">
          {onAddCategory && (
            <button
              type="button"
              onClick={onAddCategory}
              aria-label="Add new category"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:text-slate-950 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              <Plus className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">Add Category</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            aria-label="Add new staff member"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-700"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {paginatedRows.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">No staff members found</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategoryFilter !== "all"
                ? "Try adjusting your search terms or filter selection."
                : "Get started by adding your first staff member to this directory."}
            </p>
            {(searchQuery || selectedCategoryFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategoryFilter("all");
                }}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="py-3.5 pl-5 pr-3 w-12">#</th>
                    <th scope="col" className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="group inline-flex items-center gap-1 font-bold text-slate-600 hover:text-teal-700"
                      >
                        Staff Name
                        <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-teal-600" />
                      </button>
                    </th>
                    <th scope="col" className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("designation")}
                        className="group inline-flex items-center gap-1 font-bold text-slate-600 hover:text-teal-700"
                      >
                        {mode === "schoolStaff" ? "Designation / Role" : "Expertise"}
                        <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-teal-600" />
                      </button>
                    </th>
                    <th scope="col" className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("category")}
                        className="group inline-flex items-center gap-1 font-bold text-slate-600 hover:text-teal-700"
                      >
                        {mode === "schoolStaff" ? "Category" : "Department"}
                        <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-teal-600" />
                      </button>
                    </th>
                    <th scope="col" className="py-3.5 pl-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRows.map((row, idx) => {
                    const rowNumber = (safePage - 1) * pageSize + idx + 1;
                    const { member, categoryId, categoryTitle } = row;
                    const designationText =
                      "designation" in member
                        ? member.designation
                        : member.expertise || "Faculty";
                    const roleTag =
                      "officialRole" in member && member.officialRole
                        ? member.officialRole
                        : null;

                    return (
                      <tr
                        key={`${categoryId}-${member.id}`}
                        className="hover:bg-teal-50/30 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3.5 pl-5 pr-3 text-xs font-semibold text-slate-400">
                          {rowNumber}
                        </td>

                        {/* Staff Name & Photo */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                              {member.image ? (
                                <ImageWithSkeleton
                                  src={member.image}
                                  alt={member.name}
                                  aspectRatio="none"
                                  className="h-full w-full object-cover object-top"
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center bg-slate-100 text-slate-400 font-bold text-xs">
                                  {member.name[0] || "S"}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="block font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                                {member.name}
                              </span>
                              {"expertise" in member && member.expertise && "designation" in member && (
                                <span className="block text-xs text-slate-500 truncate">
                                  {member.expertise}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Designation / Expertise */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <span className="block text-xs font-bold text-slate-800">
                              {designationText}
                            </span>
                            {roleTag && roleTag !== designationText && (
                              <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                {roleTag}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 border border-teal-200/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                            {categoryTitle}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-3 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Photo Upload quick trigger */}
                            {onUploadPhoto && (
                              <label
                                title={`Replace photo for ${member.name}`}
                                aria-label={`Replace photo for ${member.name}`}
                                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-teal-700"
                              >
                                <Upload className="h-4 w-4" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  aria-label={`Upload photo file for ${member.name}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.currentTarget.value = "";
                                    if (file) onUploadPhoto(file, categoryId, member.id);
                                  }}
                                />
                              </label>
                            )}

                            {/* Edit Member */}
                            <button
                              type="button"
                              onClick={() => setEditingMemberRow(row)}
                              title={`Edit details for ${member.name}`}
                              aria-label={`Edit details for ${member.name}`}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            {/* Delete Member */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(categoryId, member.id)}
                              title={`Delete ${member.name}`}
                              aria-label={`Delete ${member.name}`}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedRows.map((row) => {
                const { member, categoryId, categoryTitle } = row;
                const designationText =
                  "designation" in member
                    ? member.designation
                    : member.expertise || "Faculty";

                return (
                  <div key={`${categoryId}-${member.id}`} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                          {member.image ? (
                            <ImageWithSkeleton
                              src={member.image}
                              alt={member.name}
                              aspectRatio="none"
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center bg-slate-100 text-slate-500 font-bold text-sm">
                              {member.name[0] || "S"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {member.name}
                          </h4>
                          <p className="text-xs font-semibold text-slate-700 truncate">{designationText}</p>
                          <span className="mt-1 inline-block rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200/50">
                            {categoryTitle}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingMemberRow(row)}
                          aria-label={`Edit ${member.name}`}
                          className="p-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-teal-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(categoryId, member.id)}
                          aria-label={`Delete ${member.name}`}
                          className="p-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-700">
              {/* Pagination Info */}
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-slate-950 font-bold">{(safePage - 1) * pageSize + 1}</strong> to{" "}
                  <strong className="text-slate-950 font-bold">
                    {Math.min(safePage * pageSize, totalItems)}
                  </strong>{" "}
                  of <strong className="text-slate-950 font-bold">{totalItems}</strong> entries
                </span>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 ml-2 border-l border-slate-300 pl-3">
                  <span className="text-slate-700 font-semibold">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Staff records per page"
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/25 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1" role="navigation" aria-label="Pagination Navigation">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-teal-700"
                  title="First Page"
                  aria-label="Go to first page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Prev Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-teal-700"
                  title="Previous Page"
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Number Pills */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - safePage) <= 1 || p === 1 || p === totalPages)
                    .map((p, i, arr) => {
                      const prev = arr[i - 1];
                      const showEllipsis = prev && p - prev > 1;

                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-slate-500 font-bold" aria-hidden="true">…</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            aria-label={`Page ${p}`}
                            aria-current={safePage === p ? "page" : undefined}
                            className={`h-7 w-7 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-teal-700 ${
                              safePage === p
                                ? "bg-teal-700 text-white shadow-xs"
                                : "bg-white text-slate-800 border border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-teal-700"
                  title="Next Page"
                  aria-label="Go to next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-teal-700"
                  title="Last Page"
                  aria-label="Go to last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Member Modal */}
      {editingMemberRow && (
        <EditMemberModal
          row={editingMemberRow}
          categories={categories}
          onClose={() => setEditingMemberRow(null)}
          onSave={handleUpdateMember}
          onUploadPhoto={onUploadPhoto}
        />
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-staff-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="add-staff-modal-title" className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-teal-700" aria-hidden="true" />
                Add New Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 text-slate-500 hover:text-slate-800 rounded-lg focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label htmlFor="new-member-category-select" className="block text-xs font-bold text-slate-800">
                Select Category / Department
              </label>
              <select
                id="new-member-category-select"
                value={newMemberCategory}
                onChange={(e) => setNewMemberCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-950 shadow-2xs outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/25"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateMember(newMemberCategory)}
                className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-700"
              >
                Create Staff Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Component for Editing a Staff Member */
function EditMemberModal({
  row,
  categories,
  onClose,
  onSave,
  onUploadPhoto,
}: {
  row: FlattenedStaffRow;
  categories: EditableCategory[];
  onClose: () => void;
  onSave: (updated: EditableMember, targetCategoryId: string) => void;
  onUploadPhoto?: (file: File, categoryId: string, memberId: string) => void;
}) {
  const [formData, setFormData] = useState<EditableMember>({ ...row.member });
  const [targetCatId, setTargetCatId] = useState<string>(row.categoryId);

  const isSchoolStaff = "designation" in formData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, targetCatId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-staff-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-800">
              Editing Staff Record
            </span>
            <h3 id="edit-staff-modal-title" className="text-xl font-bold text-slate-950">{formData.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit dialog"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo & Upload Section */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
              {formData.image ? (
                <ImageWithSkeleton
                  src={formData.image}
                  alt={formData.name}
                  aspectRatio="none"
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-slate-100 text-slate-500 font-bold text-lg">
                  {formData.name[0] || "S"}
                </div>
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <label htmlFor="staff-photo-url-input" className="block text-xs font-bold text-slate-800">Staff Photo</label>
              <div className="flex items-center gap-2">
                {onUploadPhoto && (
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-100 transition-all cursor-pointer focus-within:ring-2 focus-within:ring-teal-700">
                    <Upload className="h-3.5 w-3.5" />
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      aria-label={`Upload photo for ${formData.name}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.currentTarget.value = "";
                        if (file) {
                          onUploadPhoto(file, targetCatId, formData.id);
                        }
                      }}
                    />
                  </label>
                )}
                <input
                  id="staff-photo-url-input"
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="Or enter image URL / path..."
                  aria-label="Staff photo URL or path"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/25"
                />
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* Full Name */}
            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="edit-staff-fullname" className="block text-xs font-bold text-slate-800">Full Name</label>
              <input
                id="edit-staff-fullname"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-950 shadow-2xs outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/25"
              />
            </div>

            {/* Category */}
            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="edit-staff-category" className="block text-xs font-bold text-slate-800">
                Category / Department
              </label>
              <select
                id="edit-staff-category"
                value={targetCatId}
                onChange={(e) => setTargetCatId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-950 shadow-2xs outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/25 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Designation (School Staff) */}
            {isSchoolStaff && (
              <div className="space-y-1">
                <label htmlFor="edit-staff-designation" className="block text-xs font-bold text-slate-800">Designation</label>
                <input
                  id="edit-staff-designation"
                  type="text"
                  value={(formData as SchoolStaffMember).designation || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      designation: e.target.value,
                    } as SchoolStaffMember)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-950 shadow-2xs outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/25"
                />
              </div>
            )}

            {/* Official Role (School Staff) */}
            {isSchoolStaff && (
              <div className="space-y-1">
                <label htmlFor="edit-staff-official-role" className="block text-xs font-bold text-slate-800">Official Role</label>
                <input
                  id="edit-staff-official-role"
                  type="text"
                  value={(formData as SchoolStaffMember).officialRole || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      officialRole: e.target.value,
                    } as SchoolStaffMember)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-950 shadow-2xs outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/25"
                />
              </div>
            )}

            {/* Expertise / Qualification */}
            <div className={`${isSchoolStaff ? "sm:col-span-2" : "sm:col-span-2"} space-y-1`}>
              <label htmlFor="edit-staff-expertise" className="block text-xs font-bold text-slate-800">
                Expertise / Qualification
              </label>
              <input
                id="edit-staff-expertise"
                type="text"
                value={formData.expertise || ""}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                placeholder="e.g. M.Sc. Physics, 10+ Years Teaching"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-950 shadow-2xs outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/25"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-all shadow-xs cursor-pointer active:scale-98 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-700"
            >
              <Check className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
