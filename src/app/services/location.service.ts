import { Injectable, signal } from '@angular/core';

export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
  provinceCode: string;
}

export interface Ward {
  code: string;
  name: string;
  districtCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  // Mock data for Vietnam provinces, districts, and wards
  private provinces: Province[] = [
    { code: 'HCM', name: 'TP. Hồ Chí Minh' },
    { code: 'HN', name: 'Hà Nội' },
    { code: 'DN', name: 'Đà Nẵng' },
    { code: 'CT', name: 'Cần Thơ' },
    { code: 'HP', name: 'Hải Phòng' }
  ];

  private districts: District[] = [
    // HCM districts
    { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' },
    { code: 'HCM-Q2', name: 'Quận 2', provinceCode: 'HCM' },
    { code: 'HCM-Q3', name: 'Quận 3', provinceCode: 'HCM' },
    { code: 'HCM-Q4', name: 'Quận 4', provinceCode: 'HCM' },
    { code: 'HCM-Q5', name: 'Quận 5', provinceCode: 'HCM' },
    { code: 'HCM-Q7', name: 'Quận 7', provinceCode: 'HCM' },
    { code: 'HCM-Q10', name: 'Quận 10', provinceCode: 'HCM' },
    { code: 'HCM-TB', name: 'Quận Tân Bình', provinceCode: 'HCM' },
    { code: 'HCM-BT', name: 'Quận Bình Thạnh', provinceCode: 'HCM' },
    { code: 'HCM-PN', name: 'Quận Phú Nhuận', provinceCode: 'HCM' },
    
    // Hanoi districts
    { code: 'HN-HK', name: 'Quận Hoàn Kiếm', provinceCode: 'HN' },
    { code: 'HN-BD', name: 'Quận Ba Đình', provinceCode: 'HN' },
    { code: 'HN-DD', name: 'Quận Đống Đa', provinceCode: 'HN' },
    { code: 'HN-HBT', name: 'Quận Hai Bà Trưng', provinceCode: 'HN' },
    { code: 'HN-CG', name: 'Quận Cầu Giấy', provinceCode: 'HN' },
    
    // Da Nang districts
    { code: 'DN-HC', name: 'Quận Hải Châu', provinceCode: 'DN' },
    { code: 'DN-TK', name: 'Quận Thanh Khê', provinceCode: 'DN' },
    { code: 'DN-SH', name: 'Quận Sơn Trà', provinceCode: 'DN' },
    
    // Can Tho districts
    { code: 'CT-NK', name: 'Quận Ninh Kiều', provinceCode: 'CT' },
    { code: 'CT-BT', name: 'Quận Bình Thủy', provinceCode: 'CT' },
    
    // Hai Phong districts
    { code: 'HP-HY', name: 'Quận Hồng Bàng', provinceCode: 'HP' },
    { code: 'HP-LC', name: 'Quận Lê Chân', provinceCode: 'HP' }
  ];

  private wards: Ward[] = [
    // HCM Q1 wards
    { code: 'HCM-Q1-BN', name: 'Phường Bến Nghé', districtCode: 'HCM-Q1' },
    { code: 'HCM-Q1-BT', name: 'Phường Bến Thành', districtCode: 'HCM-Q1' },
    { code: 'HCM-Q1-NT', name: 'Phường Nguyễn Thái Bình', districtCode: 'HCM-Q1' },
    { code: 'HCM-Q1-CL', name: 'Phường Cô Giang', districtCode: 'HCM-Q1' },
    
    // HCM Q2 wards
    { code: 'HCM-Q2-TM', name: 'Phường Thảo Điền', districtCode: 'HCM-Q2' },
    { code: 'HCM-Q2-AP', name: 'Phường An Phú', districtCode: 'HCM-Q2' },
    { code: 'HCM-Q2-AK', name: 'Phường An Khánh', districtCode: 'HCM-Q2' },
    
    // HCM Q3 wards
    { code: 'HCM-Q3-P1', name: 'Phường 1', districtCode: 'HCM-Q3' },
    { code: 'HCM-Q3-P2', name: 'Phường 2', districtCode: 'HCM-Q3' },
    { code: 'HCM-Q3-P3', name: 'Phường 3', districtCode: 'HCM-Q3' },
    
    // HCM Q7 wards
    { code: 'HCM-Q7-TP', name: 'Phường Tân Phú', districtCode: 'HCM-Q7' },
    { code: 'HCM-Q7-TQ', name: 'Phường Tân Quy', districtCode: 'HCM-Q7' },
    { code: 'HCM-Q7-TH', name: 'Phường Tân Hưng', districtCode: 'HCM-Q7' },
    
    // Hanoi HK wards
    { code: 'HN-HK-HT', name: 'Phường Hàng Trống', districtCode: 'HN-HK' },
    { code: 'HN-HK-HB', name: 'Phường Hàng Bạc', districtCode: 'HN-HK' },
    { code: 'HN-HK-LT', name: 'Phường Lý Thái Tổ', districtCode: 'HN-HK' },
    
    // Hanoi BD wards
    { code: 'HN-BD-QT', name: 'Phường Quán Thánh', districtCode: 'HN-BD' },
    { code: 'HN-BD-NB', name: 'Phường Ngọc Hà', districtCode: 'HN-BD' },
    
    // Da Nang HC wards
    { code: 'DN-HC-TT', name: 'Phường Thạch Thang', districtCode: 'DN-HC' },
    { code: 'DN-HC-HT', name: 'Phường Hải Châu 1', districtCode: 'DN-HC' },
    
    // Can Tho NK wards
    { code: 'CT-NK-XK', name: 'Phường Xuân Khánh', districtCode: 'CT-NK' },
    { code: 'CT-NK-TH', name: 'Phường Tân Hòa', districtCode: 'CT-NK' }
  ];

  constructor() { }

  /**
   * Get all provinces
   */
  getProvinces(): Province[] {
    return [...this.provinces];
  }

  /**
   * Get districts by province code
   * Implements cascading filter: only returns districts belonging to the selected province
   */
  getDistrictsByProvince(provinceCode: string): District[] {
    return this.districts.filter(d => d.provinceCode === provinceCode);
  }

  /**
   * Get wards by district code
   * Implements cascading filter: only returns wards belonging to the selected district
   */
  getWardsByDistrict(districtCode: string): Ward[] {
    return this.wards.filter(w => w.districtCode === districtCode);
  }

  /**
   * Get province by code
   */
  getProvinceByCode(code: string): Province | undefined {
    return this.provinces.find(p => p.code === code);
  }

  /**
   * Get district by code
   */
  getDistrictByCode(code: string): District | undefined {
    return this.districts.find(d => d.code === code);
  }

  /**
   * Get ward by code
   */
  getWardByCode(code: string): Ward | undefined {
    return this.wards.find(w => w.code === code);
  }

  /**
   * Search provinces by name
   */
  searchProvinces(query: string): Province[] {
    const lowerQuery = query.toLowerCase();
    return this.provinces.filter(p => 
      p.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Search districts by name within a province
   */
  searchDistricts(provinceCode: string, query: string): District[] {
    const lowerQuery = query.toLowerCase();
    return this.getDistrictsByProvince(provinceCode).filter(d =>
      d.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Search wards by name within a district
   */
  searchWards(districtCode: string, query: string): Ward[] {
    const lowerQuery = query.toLowerCase();
    return this.getWardsByDistrict(districtCode).filter(w =>
      w.name.toLowerCase().includes(lowerQuery)
    );
  }
}
