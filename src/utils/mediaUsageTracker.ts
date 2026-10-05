import {
  MediaCategoryType,
  MediaMetadata,
  MediaUsageReference,
  MediaVisibility,
  PortfolioConfig,
  SfxActionType,
} from '../types/portfolio';

export const detectMediaCategory = (mimeType: string, filename: string): MediaCategoryType => {
  const mime = (mimeType || '').toLowerCase();
  const ext = (filename.split('.').pop() || '').toLowerCase();

  if (
    mime.startsWith('video/') ||
    ['mp4', 'mov', 'webm', 'mkv', 'm4v', 'avi', 'ogg'].includes(ext)
  ) {
    return 'video';
  }
  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif'].includes(ext)
  ) {
    return 'image';
  }
  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)
  ) {
    return 'audio';
  }
  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    ['pdf', 'doc', 'docx', 'txt'].includes(ext)
  ) {
    return 'document';
  }
  return 'other';
};

const matchesAssetUrlOrId = (
  media: MediaMetadata,
  targetUrl?: string | null,
  targetMediaId?: string | null
): boolean => {
  if (targetMediaId && media.id === targetMediaId) {
    return true;
  }
  if (!targetUrl) return false;
  const cleanTarget = targetUrl.split('?')[0].trim();
  if (!cleanTarget) return false;

  const candidates = [
    media.mediaUrl,
    media.storageUrl,
    media.publicUrl,
    media.thumbnailUrl,
    media.thumbnail,
  ]
    .filter(Boolean)
    .map((u) => String(u).split('?')[0].trim());

  return candidates.includes(cleanTarget);
};

/**
 * Recomputes `usedBy`, `usageCount`, `isPublished`, and `visibility` for every Media Library item
 * based on all active public portfolio references.
 *
 * Rules:
 * 1. If an asset is referenced by ANY active public website feature (Profile Photo, Brand Logo,
 *    Project Video, Project Thumbnail, Before/After Image, Active Resume, Software Logo,
 *    Social Icon, or Enabled Audio/SFX), it is automatically marked:
 *      visibility = 'public'
 *      isPublished = true
 * 2. When an asset is removed from a public feature, that usage reference is removed from `usedBy`.
 *    If `usedBy` becomes empty (and the Admin hasn't manually pinned it), it reverts to:
 *      visibility = 'private'
 *      isPublished = false
 *    while keeping the file safely in the Admin Media Library.
 */
export const syncMediaUsageAndVisibility = (config: PortfolioConfig): PortfolioConfig => {
  const mediaList = Array.isArray(config.mediaLibrary) ? config.mediaLibrary : [];

  const updatedMedia: MediaMetadata[] = mediaList.map((media) => {
    const usedBy: MediaUsageReference[] = [];

    // 1. Profile Portrait Photo
    if (
      matchesAssetUrlOrId(
        media,
        config.profile?.portraitUrl,
        config.profile?.portraitMediaId
      )
    ) {
      usedBy.push({
        type: 'profilePhoto',
        id: 'profile',
        label: 'Profile Photo (Hero Portrait)',
      });
    }

    // 2. Brand Logo
    if (
      matchesAssetUrlOrId(media, config.profile?.logoUrl, config.profile?.logoMediaId)
    ) {
      usedBy.push({
        type: 'brandLogo',
        id: 'brandLogo',
        label: 'Navbar & Footer Brand Logo',
      });
    }

    // 3. Official Showreel Video
    if (
      matchesAssetUrlOrId(
        media,
        config.profile?.showreelVideoUrl,
        config.profile?.showreelMediaId
      )
    ) {
      usedBy.push({
        type: 'showreel',
        id: 'showreel',
        label: 'Hero Official Showreel',
      });
    }

    // 4. Portfolio Projects (Video & Thumbnail)
    (config.projects || []).forEach((proj) => {
      if (proj.videoMediaId === media.id) {
        usedBy.push({
          type: 'projectVideo',
          id: proj.id,
          label: `Project — ${proj.title}`,
        });
      } else if (
        proj.thumbnailMediaId === media.id ||
        (proj.thumbnail &&
          matchesAssetUrlOrId(media, proj.thumbnail, proj.thumbnailMediaId))
      ) {
        usedBy.push({
          type: 'projectThumbnail',
          id: proj.id,
          label: `Project Thumbnail — ${proj.title}`,
        });
      }
    });

    // 5. Before / After Color Grading Comparisons
    (config.beforeAfterItems || []).forEach((ba) => {
      if (matchesAssetUrlOrId(media, ba.beforeImageUrl, ba.beforeMediaId)) {
        usedBy.push({
          type: 'beforeAfterBefore',
          id: ba.id,
          label: `Before/After (Before) — ${ba.title}`,
        });
      }
      if (matchesAssetUrlOrId(media, ba.afterImageUrl, ba.afterMediaId)) {
        usedBy.push({
          type: 'beforeAfterAfter',
          id: ba.id,
          label: `Before/After (After) — ${ba.title}`,
        });
      }
    });

    // 6. Active Resume / CV
    if (
      config.resume &&
      matchesAssetUrlOrId(media, config.resume.fileUrl, config.resume.mediaId || config.resume.id)
    ) {
      usedBy.push({
        type: 'resume',
        id: config.resume.id,
        label: `Active Resume / CV (${config.resume.filename})`,
      });
    }

    // 7. Software & Tools Logos
    (config.softwareTools || []).forEach((tool) => {
      if (matchesAssetUrlOrId(media, tool.logoUrl, tool.logoMediaId)) {
        usedBy.push({
          type: 'softwareLogo',
          id: tool.id,
          label: `Software Logo — ${tool.name}`,
        });
      }
    });

    // 8. Social Links Custom Icons
    (config.socialLinks || []).forEach((soc) => {
      if (matchesAssetUrlOrId(media, soc.iconUrl, soc.iconMediaId)) {
        usedBy.push({
          type: 'socialIcon',
          id: soc.id,
          label: `Social Icon — ${soc.platform}`,
        });
      }
    });

    // 9. Audio System (BGM & Custom SFX)
    if (config.audio) {
      if (
        config.audio.bgmUrl &&
        matchesAssetUrlOrId(media, config.audio.bgmUrl, config.audio.bgmMediaId)
      ) {
        if (config.audio.masterEnabled && config.audio.bgmEnabled) {
          usedBy.push({
            type: 'bgmAudio',
            id: 'bgm',
            label: 'Background Music (Active)',
          });
        }
      }

      if (config.audio.sfxSlots) {
        (Object.keys(config.audio.sfxSlots) as SfxActionType[]).forEach((slotKey) => {
          const slot = config.audio.sfxSlots[slotKey];
          if (
            slot &&
            slot.audioUrl &&
            matchesAssetUrlOrId(media, slot.audioUrl, slot.mediaId)
          ) {
            if (config.audio.masterEnabled && config.audio.sfxMasterEnabled && slot.enabled) {
              usedBy.push({
                type: 'sfxAudio',
                id: slotKey,
                label: `SFX — ${slot.label}`,
              });
            }
          }
        });
      }
    }

    const usageCount = usedBy.length;
    const isActivelyUsed = usageCount > 0;
    const visibility: MediaVisibility = isActivelyUsed ? 'public' : 'private';
    const isPublished = isActivelyUsed;
    const mediaType = media.mediaType || detectMediaCategory(media.mimeType, media.filename);
    const status = media.status || media.uploadStatus || 'ready';
    const playableUrl = media.mediaUrl || media.storageUrl || media.publicUrl || '';

    return {
      ...media,
      fileName: media.filename || media.fileName || 'asset',
      originalFileName: media.originalFileName || media.filename || 'asset',
      mediaType,
      type: mediaType,
      fileSize: media.size || media.fileSize || 0,
      publicUrl: playableUrl,
      mediaUrl: playableUrl,
      storageUrl: playableUrl,
      uploadedAt: media.uploadedAt || media.createdAt || Date.now(),
      updatedAt: Date.now(),
      uploadedBy: media.uploadedBy || 'admin',
      visibility,
      isPublished,
      status,
      uploadStatus: status,
      usedBy,
      usageCount,
    };
  });

  return {
    ...config,
    mediaLibrary: updatedMedia,
  };
};

/**
 * Removes or replaces all references to a specific media item across the portfolio
 * so that deleting or replacing a used asset never leaves broken public references.
 */
export const detachOrReplaceMediaReferences = (
  config: PortfolioConfig,
  targetMediaId: string,
  replacementMedia?: MediaMetadata | null
): PortfolioConfig => {
  const targetMedia = config.mediaLibrary.find((m) => m.id === targetMediaId);
  const targetUrl =
    targetMedia?.mediaUrl || targetMedia?.storageUrl || targetMedia?.publicUrl || '';
  const replacementUrl = replacementMedia
    ? replacementMedia.mediaUrl || replacementMedia.storageUrl || replacementMedia.publicUrl || ''
    : '';
  const replacementId = replacementMedia ? replacementMedia.id : undefined;

  const isTargetUrl = (url?: string | null) => {
    if (!url || !targetUrl) return false;
    return url.split('?')[0].trim() === targetUrl.split('?')[0].trim();
  };

  // 1. Profile
  const nextProfile = { ...config.profile };
  if (
    nextProfile.portraitMediaId === targetMediaId ||
    isTargetUrl(nextProfile.portraitUrl)
  ) {
    nextProfile.portraitUrl = replacementUrl || '';
    nextProfile.portraitMediaId = replacementId || null;
  }
  if (nextProfile.logoMediaId === targetMediaId || isTargetUrl(nextProfile.logoUrl)) {
    nextProfile.logoUrl = replacementUrl || undefined;
    nextProfile.logoMediaId = replacementId || null;
  }

  // 2. Projects
  const nextProjects = (config.projects || []).map((proj) => {
    let updated = { ...proj };
    if (proj.videoMediaId === targetMediaId) {
      updated = {
        ...updated,
        videoMediaId: replacementId || undefined,
        thumbnail: replacementMedia
          ? replacementMedia.thumbnailUrl || replacementMedia.thumbnail || ''
          : '',
        duration: replacementMedia?.durationFormatted || updated.duration,
      };
    }
    if (proj.thumbnailMediaId === targetMediaId || isTargetUrl(proj.thumbnail)) {
      updated = {
        ...updated,
        thumbnailMediaId: replacementId || undefined,
        thumbnail: replacementUrl || '',
      };
    }
    return updated;
  });

  // 3. Before / After
  const nextBeforeAfter = (config.beforeAfterItems || []).map((ba) => {
    let updated = { ...ba };
    if (ba.beforeMediaId === targetMediaId || isTargetUrl(ba.beforeImageUrl)) {
      updated = {
        ...updated,
        beforeImageUrl: replacementUrl || '',
        beforeMediaId: replacementId || null,
      };
    }
    if (ba.afterMediaId === targetMediaId || isTargetUrl(ba.afterImageUrl)) {
      updated = {
        ...updated,
        afterImageUrl: replacementUrl || '',
        afterMediaId: replacementId || null,
      };
    }
    return updated;
  });

  // 4. Resume
  let nextResume = config.resume;
  if (
    nextResume &&
    (nextResume.mediaId === targetMediaId ||
      nextResume.id === targetMediaId ||
      isTargetUrl(nextResume.fileUrl))
  ) {
    nextResume = replacementMedia
      ? {
          id: replacementMedia.id,
          mediaId: replacementMedia.id,
          type: 'resume',
          filename: replacementMedia.filename,
          fileUrl: replacementUrl,
          mimeType: replacementMedia.mimeType,
          size: replacementMedia.size,
          createdAt: replacementMedia.createdAt,
          updatedAt: Date.now(),
        }
      : null;
  }

  // 5. Software Logos
  const nextSoftware = (config.softwareTools || []).map((tool) => {
    if (tool.logoMediaId === targetMediaId || isTargetUrl(tool.logoUrl)) {
      return {
        ...tool,
        logoUrl: replacementUrl || null,
        logoMediaId: replacementId || null,
      };
    }
    return tool;
  });

  // 6. Social Icons
  const nextSocials = (config.socialLinks || []).map((soc) => {
    if (soc.iconMediaId === targetMediaId || isTargetUrl(soc.iconUrl)) {
      return {
        ...soc,
        iconUrl: replacementUrl || null,
        iconMediaId: replacementId || null,
      };
    }
    return soc;
  });

  // 7. Audio
  const nextAudio = { ...config.audio };
  if (nextAudio.bgmMediaId === targetMediaId || isTargetUrl(nextAudio.bgmUrl)) {
    nextAudio.bgmUrl = replacementUrl || null;
    nextAudio.bgmMediaId = replacementId || null;
    nextAudio.bgmFilename = replacementMedia ? replacementMedia.filename : null;
    if (!replacementUrl) {
      nextAudio.bgmEnabled = false;
    }
  }
  if (nextAudio.sfxSlots) {
    const nextSlots = { ...nextAudio.sfxSlots };
    (Object.keys(nextSlots) as SfxActionType[]).forEach((slotKey) => {
      const slot = nextSlots[slotKey];
      if (slot && (slot.mediaId === targetMediaId || isTargetUrl(slot.audioUrl))) {
        nextSlots[slotKey] = {
          ...slot,
          audioUrl: replacementUrl || null,
          mediaId: replacementId || null,
          filename: replacementMedia ? replacementMedia.filename : null,
        };
      }
    });
    nextAudio.sfxSlots = nextSlots;
  }

  return {
    ...config,
    profile: nextProfile,
    projects: nextProjects,
    beforeAfterItems: nextBeforeAfter,
    resume: nextResume,
    softwareTools: nextSoftware,
    socialLinks: nextSocials,
    audio: nextAudio,
  };
};

/**
 * Returns a sanitized public PortfolioConfig that strips out all private/unpublished
 * Media Library items so the public frontend NEVER receives or enumerates private media.
 */
export const createPublicPortfolioSnapshot = (config: PortfolioConfig): PortfolioConfig => {
  const synced = syncMediaUsageAndVisibility(config);
  const publishedOnlyMedia = synced.mediaLibrary.filter(
    (m) => m.visibility === 'public' && m.isPublished === true && (m.usageCount || 0) > 0
  );

  return {
    ...synced,
    mediaLibrary: publishedOnlyMedia,
  };
};
