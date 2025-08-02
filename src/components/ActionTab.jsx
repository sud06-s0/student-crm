import React from 'react';
// Import all action button components
import Stage2ActionButton from './Stage2ActionButton';
import Stage3ActionButton from './Stage3ActionButton';
import Stage4ActionButton from './Stage4ActionButton';
import Stage5ActionButton from './Stage5ActionButton';
import Stage6ActionButton from './Stage6ActionButton';
import Stage7ActionButton from './Stage7ActionButton';
import Stage8ActionButton from './Stage8ActionButton';
import Stage9ActionButton from './Stage9ActionButton';

const ActionTab = ({
  selectedLead,
  sidebarFormData,
  stageStatuses,
  onStatusUpdate,
  getFieldLabel
}) => {
  return (
    <div className="lead-sidebar-tab-content">
      {/* Header Row */}
      <div className="lead-sidebar-action-header">
        <div>Stage Name</div>
        <div>Action</div>
        <div>Status</div>
      </div>

      {/* Stage Rows */}
      {/* Stage 2: Connected */}
      <div className="lead-sidebar-action-row">
        <div className="lead-sidebar-action-stage">Stage 2 Connected</div>
        <div>
          <Stage2ActionButton
            leadId={selectedLead?.id}
            currentStatus={stageStatuses.stage2_status}
            onStatusUpdate={onStatusUpdate}
            getFieldLabel={getFieldLabel}
            alwaysVisible={true}
            parentsName={selectedLead?.parentsName}
            meetingDate={sidebarFormData.meetingDate}
            meetingTime={sidebarFormData.meetingTime}
            meetingLink={sidebarFormData.meetingLink}
            phone={selectedLead?.phone}
          />
        </div>
        <div>
          {stageStatuses.stage2_status === 'SENT' && (
            <span className="lead-sidebar-action-status">SENT</span>
          )}
        </div>
      </div>

      {/* Stage 4: Meeting Done */}
      <div className="lead-sidebar-action-row">
        <div className="lead-sidebar-action-stage">Stage 4 Meeting Done</div>
        <div>
          <Stage4ActionButton
            leadId={selectedLead?.id}
            currentStatus={stageStatuses.stage4_status}
            onStatusUpdate={onStatusUpdate}
            getFieldLabel={getFieldLabel}
            alwaysVisible={true}
            parentsName={selectedLead?.parentsName}
            phone={selectedLead?.phone}
          />
        </div>
        <div>
          {stageStatuses.stage4_status === 'SENT' && (
            <span className="lead-sidebar-action-status">SENT</span>
          )}
        </div>
      </div>

      {/* Stage 5: Proposal Sent */}
      <div className="lead-sidebar-action-row">
        <div className="lead-sidebar-action-stage">Stage 5 Proposal Sent</div>
        <div>
          <Stage5ActionButton
            leadId={selectedLead?.id}
            currentStatus={stageStatuses.stage5_status}
            onStatusUpdate={onStatusUpdate}
            getFieldLabel={getFieldLabel}  
            alwaysVisible={true}
            parentsName={selectedLead?.parentsName}
            visitDate={sidebarFormData.visitDate}
            visitTime={sidebarFormData.visitTime}
            phone={selectedLead?.phone}
          />
        </div>
        <div>
          {stageStatuses.stage5_status === 'SENT' && (
            <span className="lead-sidebar-action-status">SENT</span>
          )}
        </div>
      </div>

      {/* Stage 7: Visit Done */}
      <div className="lead-sidebar-action-row">
        <div className="lead-sidebar-action-stage">Stage 7 Visit Done</div>
        <div>
          <Stage7ActionButton
            leadId={selectedLead?.id}
            currentStatus={stageStatuses.stage7_status}
            onStatusUpdate={onStatusUpdate}
            getFieldLabel={getFieldLabel}
            alwaysVisible={true}
            parentsName={selectedLead?.parentsName}
            visitDate={sidebarFormData.visitDate}
            phone={selectedLead?.phone}
          />
        </div>
        <div>
          {stageStatuses.stage7_status === 'SENT' && (
            <span className="lead-sidebar-action-status">SENT</span>
          )}
        </div>
      </div>

      {/* Stage 8: Registered */}
      <div className="lead-sidebar-action-row">
        <div className="lead-sidebar-action-stage">Stage 8 Registered</div>
        <div>
          <Stage8ActionButton
            leadId={selectedLead?.id}
            currentStatus={stageStatuses.stage8_status}
            onStatusUpdate={onStatusUpdate}
            getFieldLabel={getFieldLabel}  
            alwaysVisible={true}
            phone={selectedLead?.phone}
          />
        </div>
        <div>
          {stageStatuses.stage8_status === 'SENT' && (
            <span className="lead-sidebar-action-status">SENT</span>
          )}
        </div>
      </div>

      {/* Stage 9: Enrolled */}
      <div className="lead-sidebar-action-row">
        <div className="lead-sidebar-action-stage">Stage 9 Enrolled</div>
        <div>
          <Stage9ActionButton
            leadId={selectedLead?.id}
            currentStatus={stageStatuses.stage9_status}
            onStatusUpdate={onStatusUpdate}
            getFieldLabel={getFieldLabel}
            alwaysVisible={true}
            kidsName={selectedLead?.kidsName}
            phone={selectedLead?.phone}
          />
        </div>
        <div>
          {stageStatuses.stage9_status === 'SENT' && (
            <span className="lead-sidebar-action-status">SENT</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionTab;