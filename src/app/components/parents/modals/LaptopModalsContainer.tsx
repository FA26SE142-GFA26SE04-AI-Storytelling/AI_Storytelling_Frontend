'use client';

import React from 'react';
import { childAccessCredentialService } from '../../../services/childAccessCredentialService';
import { useParentLaptopData } from '../hooks/useParentLaptopData';
import { AddChildModal } from './AddChildModal';
import { SupervisionPermissionsModal } from './SupervisionPermissionsModal';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { AcceptInvitationModal } from './AcceptInvitationModal';
import { SetupChildPinModal } from './SetupChildPinModal';
import { EasyLoginCardModal } from './EasyLoginCardModal';

interface LaptopModalsContainerProps {
  laptopData: ReturnType<typeof useParentLaptopData>;
}

export const LaptopModalsContainer: React.FC<LaptopModalsContainerProps> = ({ laptopData }) => {
  return (
    <>
      {/* MODAL 1: ADD NEW CHILD PROFILE */}
      <AddChildModal
        isOpen={laptopData.showAddChildModal}
        onClose={() => laptopData.setShowAddChildModal(false)}
        newChildNickname={laptopData.newChildNickname}
        setNewChildNickname={laptopData.setNewChildNickname}
        newChildAgeBand={laptopData.newChildAgeBand}
        setNewChildAgeBand={laptopData.setNewChildAgeBand}
        newChildLanguage={laptopData.newChildLanguage}
        setNewChildLanguage={laptopData.setNewChildLanguage}
        newChildScope={laptopData.newChildScope}
        setNewChildScope={laptopData.setNewChildScope}
        newChildOrgId={laptopData.newChildOrgId}
        setNewChildOrgId={laptopData.setNewChildOrgId}
        newChildClassGroupId={laptopData.newChildClassGroupId}
        setNewChildClassGroupId={laptopData.setNewChildClassGroupId}
        availableOrgs={laptopData.availableOrgs}
        availableClasses={laptopData.availableClasses}
        isLoadingOrgsAndClasses={laptopData.isLoadingOrgsAndClasses}
        loadOrgsAndClasses={laptopData.loadOrgsAndClasses}
        isCreatingChild={laptopData.isCreatingChild}
        createChildModalError={laptopData.createChildModalError}
        handleCreateChildSubmit={laptopData.handleCreateChildSubmit}
      />

      {/* MODAL 2: SUPERVISOR PERMISSIONS MANAGEMENT */}
      <SupervisionPermissionsModal
        targetSupervisor={laptopData.permissionTargetSupervisor}
        childNickname={laptopData.selectedChild?.nickname || ''}
        childScope={laptopData.selectedChild?.scope}
        onClose={() => laptopData.setPermissionTargetSupervisor(null)}
        supervisorPermissions={laptopData.supervisorPermissions}
        isLoadingPermissions={laptopData.isLoadingPermissions}
        permissionModalError={laptopData.permissionModalError}
        togglingPermissionKey={laptopData.togglingPermissionKey}
        handleTogglePermission={laptopData.handleTogglePermission}
      />

      {/* MODAL 3: TRANSFER OWNERSHIP MODAL */}
      <TransferOwnershipModal
        targetSupervisor={laptopData.transferTargetSupervisor}
        childNickname={laptopData.selectedChild?.nickname || ''}
        onClose={() => laptopData.setTransferTargetSupervisor(null)}
        isTransferringOwnership={laptopData.isTransferringOwnership}
        transferError={laptopData.transferError}
        onConfirmTransfer={laptopData.handleTransferOwnershipSubmit}
      />

      {/* MODAL 4: ACCEPT INVITATION MODAL */}
      <AcceptInvitationModal
        isOpen={laptopData.showAcceptInviteModal}
        onClose={() => laptopData.setShowAcceptInviteModal(false)}
        acceptCodeInput={laptopData.acceptCodeInput}
        setAcceptCodeInput={laptopData.setAcceptCodeInput}
        isAcceptingInvite={laptopData.isAcceptingInvite}
        acceptInviteError={laptopData.acceptInviteError}
        onAcceptSubmit={laptopData.handleAcceptInvitationSubmit}
        onRejectSubmit={laptopData.handleRejectInvitationSubmit}
      />

      {/* MODAL 5: SETUP CHILD PIN & AVATAR MODAL */}
      <SetupChildPinModal
        isOpen={laptopData.showSetupPinModal}
        onClose={() => laptopData.setShowSetupPinModal(false)}
        child={laptopData.selectedChild}
        onCredentialUpdated={() => {
          laptopData.setCredentialVersion((prev) => prev + 1);
        }}
      />

      {/* MODAL 6: EASY LOGIN CARD & BADGE MODAL */}
      <EasyLoginCardModal
        isOpen={laptopData.showEasyLoginBadgeModal}
        onClose={() => laptopData.setShowEasyLoginBadgeModal(false)}
        child={laptopData.selectedChild}
        credential={laptopData.selectedChild ? childAccessCredentialService.getCredential(laptopData.selectedChild.id) : null}
      />
    </>
  );
};
