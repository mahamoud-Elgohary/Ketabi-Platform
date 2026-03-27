import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { Profile, UpdateProfileRequest, Address } from '../../../core/models/profile.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  profile?: Profile;
  isLoading = true;
  isEditing = false;
  isSaving = false;
  errorMessage = '';

  // Form fields
  name = '';
  phone = '';
  gender: 'male' | 'female' | 'other' | '' = '';
  address: Address = { street: '', city: '' };
  avatarUrl = '';

  constructor(
    private profileService: ProfileService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.profileService.getProfile().subscribe({
      next: (response) => {
        try {
          this.profile = response.data;
          this.populateForm();
          this.isLoading = false;
        } catch (error) {
          console.error('Error populating form:', error);
          this.errorMessage = 'Error processing profile data.';
          this.isLoading = false;
          this.toast.show('Error processing profile data', 'error');
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load profile.';
        console.error('Failed to load profile:', err);
        this.isLoading = false;
        this.toast.show(this.errorMessage, 'error');
      },
    });
  }

  populateForm(): void {
    if (!this.profile) return;

    this.name = this.profile.name || '';
    this.phone = this.profile.phone || '';
    this.gender = this.profile.gender || '';
    this.avatarUrl = this.profile.avatar?.url || '';

    // Handle address (can be array or single object)
    if (this.profile.address) {
      if (Array.isArray(this.profile.address) && this.profile.address.length > 0) {
        const firstAddress = this.profile.address[0];
        // Check if firstAddress is not null/undefined
        if (firstAddress && typeof firstAddress === 'object') {
          this.address = { 
            street: firstAddress.street || '', 
            city: firstAddress.city || '' 
          };
        } else {
          this.address = { street: '', city: '' };
        }
      } else if (typeof this.profile.address === 'object' && !Array.isArray(this.profile.address)) {
        const addr = this.profile.address as Address;
        this.address = { 
          street: addr?.street || '', 
          city: addr?.city || '' 
        };
      } else {
        this.address = { street: '', city: '' };
      }
    } else {
      this.address = { street: '', city: '' };
    }
  }

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.populateForm(); // Reset form to original values
  }

  saveProfile(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;
    const updates: UpdateProfileRequest = {
      name: this.name.trim(),
      phone: this.phone.trim() || undefined,
      gender: this.gender || undefined,
      address: this.address.street || this.address.city ? this.address : undefined,
    };

    // Only include avatar if URL is provided
    if (this.avatarUrl.trim()) {
      updates.avatar = { url: this.avatarUrl.trim() };
    }

    this.profileService.updateProfile(updates).subscribe({
      next: (response) => {
        this.profile = response.data;
        this.isEditing = false;
        this.isSaving = false;
        this.toast.show('Profile updated successfully!', 'success');
        
        // Reload profile to get updated data
        this.loadProfile();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update profile.';
        console.error('Failed to update profile:', err);
        this.isSaving = false;
        this.toast.show(this.errorMessage, 'error');
      },
    });
  }

  validateForm(): boolean {
    if (!this.name.trim() || this.name.trim().length < 2) {
      this.toast.show('Name must be at least 2 characters long', 'error');
      return false;
    }

    if (this.phone && !/^\+?[0-9]{8,15}$/.test(this.phone.trim())) {
      this.toast.show('Phone number must be valid (8-15 digits)', 'error');
      return false;
    }

    if (this.address.street && !this.address.city) {
      this.toast.show('Please provide both street and city', 'error');
      return false;
    }

    if (this.address.city && !this.address.street) {
      this.toast.show('Please provide both street and city', 'error');
      return false;
    }

    return true;
  }

  getAvatarUrl(): string {
    return this.avatarUrl || this.profile?.avatar?.url || 'assets/default-book.jpg';
  }

  getDisplayAddress(): string {
    if (!this.profile?.address) return 'Not provided';
    
    if (Array.isArray(this.profile.address)) {
      if (this.profile.address.length === 0) return 'Not provided';
      const addr = this.profile.address[0];
      // Check if addr is not null/undefined and has required properties
      if (!addr || typeof addr !== 'object') return 'Not provided';
      const street = addr.street || '';
      const city = addr.city || '';
      if (!street && !city) return 'Not provided';
      return street && city ? `${street}, ${city}` : street || city;
    }
    
    // Handle single address object
    if (typeof this.profile.address === 'object' && !Array.isArray(this.profile.address)) {
      const addr = this.profile.address as Address;
      if (!addr) return 'Not provided';
      const street = addr.street || '';
      const city = addr.city || '';
      if (!street && !city) return 'Not provided';
      return street && city ? `${street}, ${city}` : street || city;
    }
    
    return 'Not provided';
  }
}

